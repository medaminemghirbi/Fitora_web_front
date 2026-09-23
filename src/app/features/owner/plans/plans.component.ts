import { Component, OnInit, computed, effect, signal, Input } from "@angular/core";
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { ContractType, ContractBillingPeriod } from "../../../core/models/contract-type.model";
import { ContractTypesService, ContractTypePayload } from "../../../core/services/contract-types.service";
import { ActivitiesService } from "../../../core/services/activities.service";
import { Activity } from "../../../core/models/activity.model";
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
import { PageHeaderComponent } from "../../../shared/ui/page-header.component";

@Component({
  selector: "app-plans",
  standalone: true,
  imports: [PageHeaderComponent, FormsModule, ReactiveFormsModule, TranslateModule, EmptyStateComponent, ModalComponent, MoneyPipe, SpinnerComponent, StatusBadgeComponent, PaginationComponent, HighlightPipe],
  templateUrl: "./plans.component.html",
  styleUrl: "./plans.component.scss",
})
export class PlansComponent implements OnInit {
  /**
   * Rendered inside the catalogue page rather than on a route of its own.
   * A price only exists where a plan crosses an activity, so the two belong
   * on one screen; the shell supplies the heading when they are there.
   */
  @Input() embedded = false;

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);

  readonly billingPeriods: ContractBillingPeriod[] = ["monthly", "quarterly", "semi_annual", "yearly"];

  readonly plans = signal<ContractType[]>([]);
  /** Every activity of the gym — the rows of the plan's pricing grid. */
  readonly activities = signal<Activity[]>([]);
  /** activity_id → price typed in the modal; absent means "not sold for it". */
  readonly activityPrices = signal<Record<string, number | null>>({});
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
    private readonly activitiesService: ActivitiesService,
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
    this.activitiesService.list().subscribe({
      next: (res) => this.activities.set(res.activities.filter((a) => a.active)),
      error: () => this.activities.set([]),
    });
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
    this.planForm.reset({ billing_period: "monthly", unlimited_bookings: true, priority_booking: false, color: "#4a2a8f", active: true });
    this.activityPrices.set({});
    this.formError.set(null);
    this.planModalOpen.set(true);
  }

  openEditPlan(plan: ContractType): void {
    this.editingPlan.set(plan);
    this.planForm.setValue({
      name: plan.name,
      description: plan.description || "",
      billing_period: plan.billing_period,
      session_count: plan.session_count,
      unlimited_bookings: plan.unlimited_bookings,
      booking_limit: plan.booking_limit,
      priority_booking: plan.priority_booking,
      color: plan.color,
      active: plan.active,
    });
    this.activityPrices.set(Object.fromEntries(plan.activity_prices.map((row) => [row.activity_id, Number(row.price)])));
    this.formError.set(null);
    this.planModalOpen.set(true);
  }

  priceFor(activityId: string): number | null {
    return this.activityPrices()[activityId] ?? null;
  }

  setPrice(activityId: string, event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const next = { ...this.activityPrices() };
    // An empty field is not "free" — it means the plan isn't offered for that
    // activity, so the row is dropped rather than priced at 0.
    if (raw === "") delete next[activityId];
    else next[activityId] = Number(raw);
    this.activityPrices.set(next);
  }

  /**
   * The two are one decision: a plan either has no limit, or it has a number
   * of sessions. Holding both produced plans named "24 Séances" that sold as
   * unlimited, because the checkbox defaulted to on and nothing cleared the
   * count beside it.
   */
  setUnlimited(unlimited: boolean): void {
    this.planForm.patchValue({
      unlimited_bookings: unlimited,
      session_count: unlimited ? null : this.planForm.controls.session_count.value,
      booking_limit: unlimited ? null : this.planForm.controls.booking_limit.value,
    });
  }

  private pricedRows(): { activity_id: string; price: number }[] {
    return Object.entries(this.activityPrices())
      .filter(([, price]) => price !== null && !Number.isNaN(price) && Number(price) >= 0)
      .map(([activity_id, price]) => ({ activity_id, price: Number(price) }));
  }

  closePlanModal(): void {
    this.planModalOpen.set(false);
  }

  submitPlan(): void {
    if (this.planForm.invalid) {
      this.planForm.markAllAsTouched();
      return;
    }

    if (!this.planForm.controls.unlimited_bookings.value && !this.planForm.controls.session_count.value) {
      this.formError.set(this.translate.instant("contract_types.needs_session_count"));
      return;
    }

    const activity_prices = this.pricedRows();
    if (activity_prices.length === 0) {
      this.formError.set(this.translate.instant("contract_types.needs_a_price"));
      return;
    }

    this.saving.set(true);
    this.formError.set(null);
    // The prices go up as a proposal: the API decides what a subscription
    // actually costs, this form never sends a total.
    const payload: ContractTypePayload = { ...this.planForm.getRawValue(), activity_prices };
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
