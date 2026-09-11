import { Component, OnInit, computed, effect, signal } from "@angular/core";
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { ContractType, ContractBillingPeriod } from "../../../core/models/contract-type.model";
import { ContractTypesService, ContractTypePayload } from "../../../core/services/contract-types.service";
import { ToastService } from "../../../core/services/toast.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";
import { ModalComponent } from "../../../shared/components/modal.component";
import { MoneyPipe } from "../../../shared/pipes/money.pipe";
import { SpinnerComponent } from "../../../shared/components/spinner.component";
import { StatusBadgeComponent } from "../../../shared/components/status-badge.component";
import { PaginationComponent } from "../../../shared/components/pagination.component";
import { HighlightPipe } from "../../../shared/pipes/highlight.pipe";
import { clientPageMeta, filterBySearch, pageSlice } from "../../../shared/utils/client-list";

@Component({
  selector: "app-settings-contract-types",
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, TranslateModule, EmptyStateComponent, ModalComponent, MoneyPipe, SpinnerComponent, StatusBadgeComponent, PaginationComponent, HighlightPipe],
  templateUrl: "./settings-contract-types.component.html",
})
export class SettingsContractTypesComponent implements OnInit {
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);

  readonly billingPeriods: ContractBillingPeriod[] = ["monthly", "quarterly", "semi_annual", "yearly"];

  readonly plans = signal<ContractType[]>([]);
  readonly planModalOpen = signal(false);
  readonly editingPlan = signal<ContractType | null>(null);

  readonly search = signal("");
  readonly page = signal(1);
  readonly filtered = computed(() => filterBySearch(this.plans(), this.search(), (p) => [p.name, p.description]));
  readonly pagedPlans = computed(() => pageSlice(this.filtered(), this.page()));
  readonly meta = computed(() => clientPageMeta(this.filtered().length, this.page()));
  readonly planForm = this.fb.nonNullable.group({
    name: ["", Validators.required],
    description: [""],
    price: [0, [Validators.required, Validators.min(0)]],
    currency: ["TND", Validators.required],
    billing_period: ["monthly" as ContractBillingPeriod, Validators.required],
    session_count: [null as number | null],
    unlimited_bookings: [true],
    booking_limit: [null as number | null],
    priority_booking: [false],
    color: ["#4a2a8f", Validators.required],
    active: [true],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly contractTypesService: ContractTypesService,
    private readonly toast: ToastService,
    private readonly route: ActivatedRoute,
    private readonly translate: TranslateService
  ) {
    effect(() => {
      this.search();
      this.page.set(1);
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.load();

    if (this.route.snapshot.queryParamMap.get("action") === "new") this.openCreatePlan();
  }

  private load(): void {
    this.loading.set(true);
    this.contractTypesService.list().subscribe({
      next: (res) => {
        this.plans.set(res.plans);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreatePlan(): void {
    this.editingPlan.set(null);
    this.planForm.reset({ currency: "TND", billing_period: "monthly", unlimited_bookings: true, priority_booking: false, color: "#4a2a8f", active: true, price: 0 });
    this.formError.set(null);
    this.planModalOpen.set(true);
  }

  openEditPlan(plan: ContractType): void {
    this.editingPlan.set(plan);
    this.planForm.setValue({
      name: plan.name,
      description: plan.description || "",
      price: plan.price,
      currency: plan.currency,
      billing_period: plan.billing_period,
      session_count: plan.session_count,
      unlimited_bookings: plan.unlimited_bookings,
      booking_limit: plan.booking_limit,
      priority_booking: plan.priority_booking,
      color: plan.color,
      active: plan.active,
    });
    this.formError.set(null);
    this.planModalOpen.set(true);
  }

  closePlanModal(): void {
    this.planModalOpen.set(false);
  }

  submitPlan(): void {
    if (this.planForm.invalid) {
      this.planForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.formError.set(null);
    const payload: ContractTypePayload = this.planForm.getRawValue();
    const editing = this.editingPlan();
    const request = editing ? this.contractTypesService.update(editing.id, payload) : this.contractTypesService.create(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.planModalOpen.set(false);
        this.toast.success(this.translate.instant("common.save"));
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }
}
