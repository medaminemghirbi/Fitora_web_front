import { Component, OnInit, computed, effect, signal } from "@angular/core";
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { WorkContractType } from "../../../core/models/work-contract.model";
import { clientPageMeta, filterBySearch, pageSlice } from "../../../shared/utils/client-list";
import { HrService } from "../../../core/services/hr.service";
import { ConfirmService } from "../../../core/services/confirm.service";
import { ToastService } from "../../../core/services/toast.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";
import { ModalComponent } from "../../../shared/components/modal.component";
import { StatusBadgeComponent } from "../../../shared/components/status-badge.component";
import { PaginationComponent } from "../../../shared/components/pagination.component";
import { HighlightPipe } from "../../../shared/pipes/highlight.pipe";
import { SkeletonComponent } from "../../../shared/ui/skeleton.component";
import { ActionMenuComponent } from "../../../shared/ui/action-menu.component";

@Component({
  selector: "app-settings-work-contract-types",
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    EmptyStateComponent,
    ModalComponent,
    StatusBadgeComponent,
    PaginationComponent,
    HighlightPipe,
    SkeletonComponent,
    ActionMenuComponent,
  ],
  templateUrl: "./settings-work-contract-types.component.html",
})
export class SettingsWorkContractTypesComponent implements OnInit {
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly types = signal<WorkContractType[]>([]);
  readonly modalOpen = signal(false);
  readonly editing = signal<WorkContractType | null>(null);
  readonly formError = signal<string | null>(null);

  readonly search = signal("");
  readonly page = signal(1);
  readonly filtered = computed(() => filterBySearch(this.types(), this.search(), (t) => [t.name, t.abbreviation]));
  readonly pagedTypes = computed(() => pageSlice(this.filtered(), this.page()));
  readonly meta = computed(() => clientPageMeta(this.filtered().length, this.page()));

  readonly form = this.fb.nonNullable.group({
    name: ["", Validators.required],
    abbreviation: ["", [Validators.required, Validators.maxLength(20)]],
    fixed_term: [false],
    active: [true],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly hr: HrService,
    private readonly confirm: ConfirmService,
    private readonly toast: ToastService,
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

  private load(): void {
    this.loading.set(true);
    this.hr.contractTypes().subscribe({
      next: (res) => {
        this.types.set(res.work_contract_types);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreate(): void {
    this.editing.set(null);
    this.form.reset({ fixed_term: false, active: true });
    this.formError.set(null);
    this.modalOpen.set(true);
  }

  openEdit(type: WorkContractType): void {
    this.editing.set(type);
    this.form.setValue({ name: type.name, abbreviation: type.abbreviation, fixed_term: type.fixed_term, active: type.active });
    this.formError.set(null);
    this.modalOpen.set(true);
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
    const req = editing ? this.hr.updateContractType(editing.id, payload) : this.hr.createContractType(payload);

    req.subscribe({
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

  async remove(type: WorkContractType): Promise<void> {
    const ok = await this.confirm.ask({
      title: this.translate.instant("settings.wct_delete_title"),
      body: this.translate.instant("settings.wct_delete_body"),
      danger: true,
    });
    if (!ok) return;
    this.hr.deleteContractType(type.id).subscribe({
      next: () => {
        this.toast.success(this.translate.instant("common.delete"));
        this.load();
      },
      error: (err) => this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic"))),
    });
  }
}
