import { Component, OnInit, computed, effect, signal } from "@angular/core";
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { API_ORIGIN } from "../../../core/models/api-config";
import { Salle } from "../../../core/models/salle.model";
import { clientPageMeta, filterBySearch, pageSlice } from "../../../shared/utils/client-list";
import { SallesService } from "../../../core/services/salles.service";
import { ToastService } from "../../../core/services/toast.service";
import { ConfirmService } from "../../../core/services/confirm.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";
import { ModalComponent } from "../../../shared/components/modal.component";
import { StatusBadgeComponent } from "../../../shared/components/status-badge.component";
import { HighlightPipe } from "../../../shared/pipes/highlight.pipe";
import { PaginationComponent } from "../../../shared/components/pagination.component";
import { SkeletonComponent } from "../../../shared/ui/skeleton.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";
import { ActionMenuComponent } from "../../../shared/ui/action-menu.component";

interface ImagePreview {
  file: File;
  url: string;
}

@Component({
  selector: "app-salles",
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    EmptyStateComponent,
    ModalComponent,
    StatusBadgeComponent,
    HighlightPipe,
    PaginationComponent,
    SkeletonComponent,
    ErrorStateComponent,
    ActionMenuComponent,
  ],
  templateUrl: "./salles.component.html",
  styleUrl: "./salles.component.scss",
})
export class SallesComponent implements OnInit {
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly saving = signal(false);
  readonly salles = signal<Salle[]>([]);
  readonly modalOpen = signal(false);
  readonly editing = signal<Salle | null>(null);
  readonly formError = signal<string | null>(null);

  readonly search = signal("");
  readonly page = signal(1);
  readonly filtered = computed(() => filterBySearch(this.salles(), this.search(), (s) => [s.name]));
  readonly pagedSalles = computed(() => pageSlice(this.filtered(), this.page()));
  readonly meta = computed(() => clientPageMeta(this.filtered().length, this.page()));

  /** New photos picked for the current create/edit form — not yet uploaded. */
  readonly newImages = signal<ImagePreview[]>([]);

  readonly form = this.fb.nonNullable.group({
    name: ["", Validators.required],
    description: [""],
    capacity: [20, [Validators.required, Validators.min(1)]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly sallesService: SallesService,
    private readonly toast: ToastService,
    private readonly confirm: ConfirmService,
    private readonly translate: TranslateService
  ) {
    effect(() => {
      this.search();
      this.page.set(1);
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.sallesService.list().subscribe({
      next: (res) => {
        this.salles.set(res.salles);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  imageUrl(path: string): string {
    return `${API_ORIGIN}${path}`;
  }

  openCreate(): void {
    this.editing.set(null);
    this.form.reset({ name: "", description: "", capacity: 20 });
    this.clearNewImages();
    this.formError.set(null);
    this.modalOpen.set(true);
  }

  openEdit(salle: Salle): void {
    this.editing.set(salle);
    this.form.setValue({
      name: salle.name,
      description: salle.description || "",
      capacity: salle.capacity,
    });
    this.clearNewImages();
    this.formError.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.clearNewImages();
  }

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = "";
    if (files.length === 0) return;

    const previews = files.map((file) => ({ file, url: URL.createObjectURL(file) }));
    this.newImages.update((current) => [...current, ...previews]);
  }

  removeNewImage(preview: ImagePreview): void {
    URL.revokeObjectURL(preview.url);
    this.newImages.update((current) => current.filter((p) => p !== preview));
  }

  private clearNewImages(): void {
    this.newImages().forEach((p) => URL.revokeObjectURL(p.url));
    this.newImages.set([]);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.formError.set(null);

    const raw = this.form.getRawValue();
    const images = this.newImages().map((p) => p.file);
    const payload = { ...raw, ...(images.length > 0 ? { images } : {}) };

    const editing = this.editing();
    const request = editing ? this.sallesService.update(editing.id, payload) : this.sallesService.create(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.modalOpen.set(false);
        this.clearNewImages();
        this.toast.success(this.translate.instant("common.save"));
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }

  async deactivate(salle: Salle): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: this.translate.instant("common.deactivate") + " " + salle.name + "?",
      body: this.translate.instant("common.confirm"),
      confirmLabel: this.translate.instant("common.deactivate"),
      danger: true,
    });
    if (!confirmed) return;

    this.sallesService.deactivate(salle.id).subscribe({
      next: () => {
        this.toast.success(this.translate.instant("common.deactivate"));
        this.load();
      },
      error: (err) => this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic"))),
    });
  }
}
