import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { Supplier } from "../../../../core/models/supplier.model";
import { SuppliersService } from "../../../../core/services/suppliers.service";
import { ToastService } from "../../../../core/services/toast.service";
import { ConfirmService } from "../../../../core/services/confirm.service";
import { extractErrorMessage, extractFieldErrors, applyFieldErrors } from "../../../../core/services/error.util";
import { PageHeaderComponent } from "../../../../shared/ui/page-header.component";
import { SkeletonComponent } from "../../../../shared/ui/skeleton.component";
import { ErrorStateComponent } from "../../../../shared/ui/error-state.component";
import { EmptyStateComponent } from "../../../../shared/components/empty-state.component";
import { ActionMenuComponent } from "../../../../shared/ui/action-menu.component";
import { FormModalComponent } from "../../../../shared/ui/form-modal.component";
import { HighlightPipe } from "../../../../shared/pipes/highlight.pipe";
import { MediaUrlPipe } from "../../../../shared/pipes/media-url.pipe";
import { API_ORIGIN } from "../../../../core/models/api-config";

type SortKey = "name" | "category" | "contact_name" | "phone" | "email" | "active";
type SortDir = "asc" | "desc";

@Component({
  selector: "app-suppliers",
  standalone: true,
  imports: [
    FormsModule, ReactiveFormsModule, TranslateModule, PageHeaderComponent, SkeletonComponent, ErrorStateComponent,
    EmptyStateComponent, ActionMenuComponent, FormModalComponent, HighlightPipe, MediaUrlPipe,
  ],
  templateUrl: "./suppliers.component.html",
  styleUrl: "./suppliers.component.scss",
})
export class SuppliersComponent implements OnInit {
  private readonly service = inject(SuppliersService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly suppliers = signal<Supplier[]>([]);

  readonly search = signal("");
  readonly statusFilter = signal<"active" | "all">("active");
  readonly sortKey = signal<SortKey>("name");
  readonly sortDir = signal<SortDir>("asc");

  readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const status = this.statusFilter();
    let rows = this.suppliers();
    if (status === "active") rows = rows.filter((s) => s.active);
    if (term) {
      rows = rows.filter((s) =>
        [ s.name, s.category, s.contact_name, s.phone, s.email ].some((v) => v?.toLowerCase().includes(term))
      );
    }
    return rows;
  });

  readonly sorted = computed(() => {
    const key = this.sortKey();
    const dir = this.sortDir() === "asc" ? 1 : -1;
    return [ ...this.filtered() ].sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (typeof av === "boolean" || typeof bv === "boolean") return (av === bv ? 0 : av ? -1 : 1) * dir;
      return String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true, sensitivity: "base" }) * dir;
    });
  });

  readonly drawerOpen = signal(false);
  readonly editing = signal<Supplier | null>(null);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  readonly photoFile = signal<File | null>(null);
  readonly photoPreview = signal<string | null>(null);
  readonly photoError = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: [ "", Validators.required ],
    category: [ "" ],
    contact_name: [ "" ],
    phone: [ "" ],
    email: [ "" ],
    address: [ "" ],
    notes: [ "" ],
    active: [ true ],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.service.list().subscribe({
      next: (res) => {
        this.suppliers.set(res.suppliers);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  toggleSort(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortDir.update((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      this.sortKey.set(key);
      this.sortDir.set("asc");
    }
  }

  sortIcon(key: SortKey): string {
    if (this.sortKey() !== key) return "bi-arrow-down-up";
    return this.sortDir() === "asc" ? "bi-sort-alpha-down" : "bi-sort-alpha-up";
  }

  // Two-letter fallback for suppliers with no logo — first letter of up to
  // the first two words ("Textile Sportswear" -> "TS").
  initials(name: string): string {
    const letters = name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? "");
    return letters.join("") || "?";
  }

  // Category is free text (the owner types it), so there's no fixed list to
  // key a colour off — this just needs to be *stable* per string, not
  // meaningful, so the same category always reads as the same colour.
  categoryTone(category: string | null | undefined): string {
    if (!category) return "neutral";
    const tones = [ "info", "success", "accent", "neutral" ];
    let hash = 0;
    for (let i = 0; i < category.length; i++) hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
    return tones[hash % tones.length];
  }

  openCreate(): void {
    this.editing.set(null);
    this.form.reset({ name: "", category: "", contact_name: "", phone: "", email: "", address: "", notes: "", active: true });
    this.photoFile.set(null);
    this.photoPreview.set(null);
    this.photoError.set(null);
    this.formError.set(null);
    this.drawerOpen.set(true);
  }

  openEdit(supplier: Supplier): void {
    this.editing.set(supplier);
    this.form.reset({
      name: supplier.name,
      category: supplier.category ?? "",
      contact_name: supplier.contact_name ?? "",
      phone: supplier.phone ?? "",
      email: supplier.email ?? "",
      address: supplier.address ?? "",
      notes: supplier.notes ?? "",
      active: supplier.active,
    });
    this.photoFile.set(null);
    this.photoPreview.set(supplier.photo_url ? `${API_ORIGIN}${supplier.photo_url}` : null);
    this.photoError.set(null);
    this.formError.set(null);
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.photoFile.set(file);
    this.photoError.set(null);
    const reader = new FileReader();
    reader.onload = () => this.photoPreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  // Server errors keyed on a field (`common.required` for a plain "can't be
  // blank", the backend's own message for anything more specific, e.g. the
  // photo's content-type/size checks) so the offending control shows its
  // own message instead of only a generic banner above the whole form.
  fieldError(name: string): string | null {
    const control = this.form.get(name);
    if (!control || !control.touched || control.valid) return null;
    if (control.hasError("server")) return control.getError("server");
    if (control.hasError("required")) return this.translate.instant("common.required");
    return null;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.formError.set(null);
    this.photoError.set(null);
    const payload = { ...this.form.getRawValue(), photo: this.photoFile() };
    const editing = this.editing();
    const req = editing ? this.service.update(editing.id, payload) : this.service.create(payload);

    req.subscribe({
      next: (res) => {
        this.saving.set(false);
        this.drawerOpen.set(false);
        this.suppliers.update((list) => {
          const saved = res.supplier;
          return editing ? list.map((s) => (s.id === saved.id ? saved : s)) : [ saved, ...list ];
        });
        this.toast.success(this.translate.instant(editing ? "suppliers.updated" : "suppliers.created"));
      },
      error: (err) => {
        this.saving.set(false);
        const fieldErrors = extractFieldErrors(err);
        if (fieldErrors) {
          const unmatched = applyFieldErrors(this.form, fieldErrors);
          if (unmatched["photo"]) this.photoError.set(unmatched["photo"]);
          delete unmatched["photo"];
          const rest = Object.values(unmatched);
          this.formError.set(rest.length ? rest.join(" · ") : null);
        } else {
          this.formError.set(extractErrorMessage(err, this.translate.instant("common.error_generic")));
        }
      },
    });
  }

  async toggleActive(supplier: Supplier): Promise<void> {
    if (supplier.active) {
      const ok = await this.confirm.ask({
        title: this.translate.instant("suppliers.deactivate_confirm_title"),
        body: this.translate.instant("suppliers.deactivate_confirm_body", { name: supplier.name }),
        confirmLabel: this.translate.instant("common.deactivate"),
        danger: true,
      });
      if (!ok) return;

      this.service.deactivate(supplier.id).subscribe({
        next: (res) => this.suppliers.update((list) => list.map((s) => (s.id === supplier.id ? res.supplier : s))),
        error: (err) => this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic"))),
      });
    } else {
      this.service.update(supplier.id, { active: true }).subscribe({
        next: (res) => this.suppliers.update((list) => list.map((s) => (s.id === supplier.id ? res.supplier : s))),
        error: (err) => this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic"))),
      });
    }
  }
}
