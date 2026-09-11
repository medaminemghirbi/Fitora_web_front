import { DatePipe } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { LibraryDocument } from "../../../core/models/library-document.model";
import { LibraryFolder } from "../../../core/models/library-folder.model";
import { LibraryDocumentFormValue, LibraryDocumentsService, LibraryDocumentStatusFilter } from "../../../core/services/library-documents.service";
import { LibraryFoldersService } from "../../../core/services/library-folders.service";
import { PageMeta } from "../../../core/services/sessions.service";
import { ToastService } from "../../../core/services/toast.service";
import { ConfirmService } from "../../../core/services/confirm.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";
import { ModalComponent } from "../../../shared/components/modal.component";
import { PaginationComponent } from "../../../shared/components/pagination.component";
import { SpinnerComponent } from "../../../shared/components/spinner.component";
import { StatusBadgeComponent } from "../../../shared/components/status-badge.component";
import { HighlightPipe } from "../../../shared/pipes/highlight.pipe";
import { SEARCH_DEBOUNCE_MS } from "../../../shared/utils/client-list";

@Component({
  selector: "app-company-library-folder",
  standalone: true,
  imports: [DatePipe, FormsModule, ReactiveFormsModule, RouterLink, TranslateModule, EmptyStateComponent, ErrorStateComponent, ModalComponent, PaginationComponent, SpinnerComponent, StatusBadgeComponent, HighlightPipe],
  templateUrl: "./company-library-folder.component.html",
  styleUrl: "./company-library-folder.component.scss",
})
export class CompanyLibraryFolderComponent implements OnInit {
  private folderId!: string;

  readonly folder = signal<LibraryFolder | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly saving = signal(false);
  readonly documents = signal<LibraryDocument[]>([]);
  readonly meta = signal<PageMeta | null>(null);
  readonly statusFilter = signal<LibraryDocumentStatusFilter | "">("");
  readonly page = signal(1);
  readonly search = signal("");
  private searchDebounce?: ReturnType<typeof setTimeout>;

  readonly modalOpen = signal(false);
  readonly editing = signal<LibraryDocument | null>(null);
  readonly formError = signal<string | null>(null);
  readonly selectedFile = signal<File | null>(null);

  readonly form = this.fb.nonNullable.group({
    title: ["", Validators.required],
    reference_number: [""],
    issued_on: [""],
    expires_on: [""],
    notes: [""],
    active: [true],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly foldersService: LibraryFoldersService,
    private readonly documentsService: LibraryDocumentsService,
    private readonly route: ActivatedRoute,
    private readonly toast: ToastService,
    private readonly confirm: ConfirmService,
    private readonly translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.folderId = this.route.snapshot.paramMap.get("folderId")!;
    this.foldersService.get(this.folderId).subscribe((res) => this.folder.set(res.folder));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.documentsService
      .list({ folder_id: this.folderId, status: (this.statusFilter() as LibraryDocumentStatusFilter) || undefined, q: this.search() || undefined, page: this.page() })
      .subscribe({
        next: (res) => {
          this.documents.set(res.documents);
          this.meta.set(res.meta);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }

  applyStatusFilter(status: LibraryDocumentStatusFilter | ""): void {
    this.statusFilter.set(status);
    this.page.set(1);
    this.load();
  }

  onSearchChange(term: string): void {
    this.search.set(term);
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.page.set(1);
      this.load();
    }, SEARCH_DEBOUNCE_MS);
  }

  onPageChange(page: number): void {
    this.page.set(page);
    this.load();
  }

  // Mirrors the backend's 30-day expiring_soon window so the inline badge
  // agrees with what the "Expiring soon" filter would return.
  isExpiringSoon(doc: LibraryDocument): boolean {
    if (!doc.expires_on || doc.expired) return false;
    const days = (new Date(doc.expires_on).getTime() - Date.now()) / 86_400_000;
    return days <= 30;
  }

  isPdf(doc: LibraryDocument): boolean {
    return doc.file?.content_type === "application/pdf";
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile.set(input.files?.[0] ?? null);
  }

  openCreate(): void {
    this.editing.set(null);
    this.selectedFile.set(null);
    this.form.reset({ title: "", reference_number: "", issued_on: "", expires_on: "", notes: "", active: true });
    this.formError.set(null);
    this.modalOpen.set(true);
  }

  openEdit(doc: LibraryDocument): void {
    this.editing.set(doc);
    this.selectedFile.set(null);
    this.form.setValue({
      title: doc.title,
      reference_number: doc.reference_number || "",
      issued_on: doc.issued_on || "",
      expires_on: doc.expires_on || "",
      notes: doc.notes || "",
      active: doc.active,
    });
    this.formError.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const editing = this.editing();
    if (!editing && !this.selectedFile()) {
      this.formError.set(this.translate.instant("company_library.file_required"));
      return;
    }

    this.saving.set(true);
    this.formError.set(null);

    const raw = this.form.getRawValue();
    const selectedFile = this.selectedFile();
    const payload: LibraryDocumentFormValue = {
      ...raw,
      reference_number: raw.reference_number || null,
      issued_on: raw.issued_on || null,
      expires_on: raw.expires_on || null,
      notes: raw.notes || null,
      folder_id: this.folderId,
      ...(selectedFile ? { file: selectedFile } : {}),
    };
    const request = editing ? this.documentsService.update(editing.id, payload) : this.documentsService.create(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.modalOpen.set(false);
        this.toast.success(this.translate.instant("common.save"));
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }

  // window.open must happen synchronously inside the click handler or
  // browsers treat it as a popup and block it — so a blank tab opens first,
  // then gets redirected once the authenticated blob fetch resolves.
  view(doc: LibraryDocument): void {
    const win = window.open("", "_blank");
    this.documentsService.downloadFile(doc).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        if (win) win.location.href = url;
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      error: () => {
        win?.close();
        this.toast.error(this.translate.instant("common.error_generic"));
      },
    });
  }

  async remove(doc: LibraryDocument): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: this.translate.instant("company_library.delete_confirm_title"),
      body: this.translate.instant("company_library.delete_confirm_body"),
      danger: true,
    });
    if (!confirmed) return;

    this.documentsService.destroy(doc.id).subscribe({
      next: () => {
        this.toast.success(this.translate.instant("company_library.deleted"));
        this.load();
      },
      error: (err) => this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic"))),
    });
  }
}
