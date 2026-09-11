import { Component, OnInit, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { LibraryFolder } from "../../../core/models/library-folder.model";
import { LibraryFoldersService } from "../../../core/services/library-folders.service";
import { ToastService } from "../../../core/services/toast.service";
import { ConfirmService } from "../../../core/services/confirm.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";
import { ModalComponent } from "../../../shared/components/modal.component";
import { PageHeaderComponent } from "../../../shared/ui/page-header.component";
import { SkeletonComponent } from "../../../shared/ui/skeleton.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";

@Component({
  selector: "app-company-library",
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule, EmptyStateComponent, ModalComponent, PageHeaderComponent, SkeletonComponent, ErrorStateComponent],
  templateUrl: "./company-library.component.html",
  styleUrl: "./company-library.component.scss",
})
export class CompanyLibraryComponent implements OnInit {
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly saving = signal(false);
  readonly folders = signal<LibraryFolder[]>([]);

  readonly modalOpen = signal(false);
  readonly editing = signal<LibraryFolder | null>(null);
  readonly formError = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ["", Validators.required],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly foldersService: LibraryFoldersService,
    private readonly router: Router,
    private readonly toast: ToastService,
    private readonly confirm: ConfirmService,
    private readonly translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.foldersService.list().subscribe({
      next: (res) => {
        this.folders.set(res.folders);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  openFolder(folder: LibraryFolder): void {
    this.router.navigate(["/owner/directories/company-library", folder.id]);
  }

  openCreate(): void {
    this.editing.set(null);
    this.form.reset({ name: "" });
    this.formError.set(null);
    this.modalOpen.set(true);
  }

  openEdit(folder: LibraryFolder, event: Event): void {
    event.stopPropagation();
    this.editing.set(folder);
    this.form.setValue({ name: folder.name });
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

    this.saving.set(true);
    this.formError.set(null);

    const payload = this.form.getRawValue();
    const editing = this.editing();
    const request = editing ? this.foldersService.update(editing.id, payload) : this.foldersService.create(payload);

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

  async remove(folder: LibraryFolder, event: Event): Promise<void> {
    event.stopPropagation();
    const confirmed = await this.confirm.ask({
      title: this.translate.instant("company_library.delete_folder_confirm_title"),
      body: this.translate.instant("company_library.delete_folder_confirm_body", { count: folder.document_count }),
      danger: true,
    });
    if (!confirmed) return;

    this.foldersService.destroy(folder.id).subscribe({
      next: () => {
        this.toast.success(this.translate.instant("company_library.folder_deleted"));
        this.load();
      },
      error: (err) => this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic"))),
    });
  }
}
