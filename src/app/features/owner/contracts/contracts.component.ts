import { Component, OnInit, computed, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { Contract, ContractStatus } from "../../../core/models/contract.model";
import { ContractType } from "../../../core/models/contract-type.model";
import { ContractTypesService } from "../../../core/services/contract-types.service";
import { ContractsService } from "../../../core/services/contracts.service";
import { PaymentsService } from "../../../core/services/payments.service";
import { ToastService } from "../../../core/services/toast.service";
import { ConfirmService } from "../../../core/services/confirm.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import { PageMeta } from "../../../core/services/sessions.service";
import { AvatarComponent } from "../../../shared/components/avatar.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";
import { PaginationComponent } from "../../../shared/components/pagination.component";
import { StatusBadgeComponent } from "../../../shared/components/status-badge.component";
import { PageHeaderComponent } from "../../../shared/ui/page-header.component";
import { HighlightPipe } from "../../../shared/pipes/highlight.pipe";
import { SEARCH_DEBOUNCE_MS } from "../../../shared/utils/client-list";
import { SkeletonComponent } from "../../../shared/ui/skeleton.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";
import { ActionMenuComponent } from "../../../shared/ui/action-menu.component";
import { FilterRailComponent } from "../../../shared/ui/filter-rail.component";
import { StatusFilterComponent, StatusFilterOption } from "../../../shared/ui/status-filter.component";
import { MoneyPipe } from "../../../shared/pipes/money.pipe";
import { BrandingService } from "../../../core/services/branding.service";

@Component({
  selector: "app-contracts",
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    RouterLink,
    TranslateModule,
    AvatarComponent,
    EmptyStateComponent,
    PaginationComponent,
    StatusBadgeComponent,
    PageHeaderComponent,
    HighlightPipe,
    SkeletonComponent,
    ErrorStateComponent,
    ActionMenuComponent,
    FilterRailComponent,
    StatusFilterComponent,
    MoneyPipe,
  ],
  templateUrl: "./contracts.component.html",
})
export class ContractsComponent implements OnInit {
  readonly loading = signal(true);
  readonly error = signal(false);

  readonly contracts = signal<Contract[]>([]);
  readonly meta = signal<PageMeta | null>(null);
  readonly page = signal(1);
  // "expiring" is not one of the four period states — it means "active and
  // running out within the month", resolved by the backend.
  readonly contractStatusFilter = signal<ContractStatus | "expiring" | "">("");
  readonly paymentFilter = signal<"unpaid" | "paid" | "">("");
  readonly contractTypeFilter = signal<string | "">("");
  readonly search = signal("");
  private searchDebounce?: ReturnType<typeof setTimeout>;

  // Only needed to populate the "Formule" filter dropdown — the catalogue
  // itself lives at Abonnements > Formules.
  readonly plans = signal<ContractType[]>([]);

  // Four colours across the whole app: green in order, orange worth
  // watching, red needs doing, grey no longer applies. "Expire bientôt" is
  // not a period state — it is active with a month to run — but it is the
  // one a desk filters by most, so it sits in the rail beside the four.
  readonly statusOptions: { value: ContractStatus | "expiring" | ""; labelKey: string; countKey: string; color: string }[] = [
    { value: "", labelKey: "clients.filter_all", countKey: "all", color: "var(--color-primary)" },
    { value: "active", labelKey: "contract.status_active", countKey: "active", color: "var(--color-success)" },
    { value: "expiring", labelKey: "contract.status_expiring", countKey: "expiring", color: "var(--color-warning)" },
    { value: "expired", labelKey: "contract.status_expired", countKey: "expired", color: "var(--color-danger)" },
    { value: "pending", labelKey: "contract.status_pending", countKey: "pending", color: "var(--color-info)" },
    { value: "cancelled", labelKey: "contract.status_cancelled", countKey: "cancelled", color: "var(--color-muted)" },
  ];

  /** Rail counts, per-plan tab counts and the portfolio strip — all from the API. */
  readonly counts = signal<Record<string, number>>({});
  readonly planCounts = signal<Record<string, number>>({});
  readonly totals = signal({ portfolio_value: 0, average_basket: 0, unpaid_value: 0, expiring_soon: 0 });
  readonly currency = computed(() => this.branding.branding()?.currency ?? "TND");

  readonly railOptions = computed<StatusFilterOption[]>(() =>
    this.statusOptions.map((opt) => ({
      value: opt.value,
      label: this.translate.instant(opt.labelKey),
      count: this.counts()[opt.countKey] ?? 0,
      color: opt.color,
    }))
  );

  constructor(
    private readonly contractsService: ContractsService,
    private readonly contractTypesService: ContractTypesService,
    private readonly branding: BrandingService,
    private readonly translate: TranslateService,
    private readonly route: ActivatedRoute,
    private readonly paymentsService: PaymentsService,
    private readonly toast: ToastService,
    private readonly confirm: ConfirmService
  ) {}

  ngOnInit(): void {
    // "Aujourd'hui" links straight to the work: ?status=expiring,
    // ?status=expired, ?payment=unpaid. Read once — this page is not
    // re-entered without a fresh navigation.
    const q = this.route.snapshot.queryParamMap;
    const status = q.get("status");
    if (status) this.contractStatusFilter.set(status as ContractStatus | "expiring");
    const payment = q.get("payment");
    if (payment === "unpaid" || payment === "paid") this.paymentFilter.set(payment);

    this.loadContracts();
    this.contractTypesService.list().subscribe((res) => this.plans.set(res.plans));
  }

  loadContracts(): void {
    this.loading.set(true);
    this.error.set(false);
    this.contractsService
      .list({
        status: this.contractStatusFilter() || undefined,
        payment: this.paymentFilter() || undefined,
        contract_type_id: this.contractTypeFilter() || undefined,
        q: this.search() || undefined,
        page: this.page(),
      })
      .subscribe({
        next: (res) => {
          this.contracts.set(res.contracts);
          this.meta.set(res.meta);
          this.counts.set(res.counts ?? {});
          this.planCounts.set(res.plan_counts ?? {});
          if (res.totals) this.totals.set(res.totals);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }

  onSearchChange(term: string): void {
    this.search.set(term);
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.page.set(1);
      this.loadContracts();
    }, SEARCH_DEBOUNCE_MS);
  }

  applyContractFilter(status: ContractStatus | ""): void {
    this.contractStatusFilter.set(status);
    this.page.set(1);
    this.loadContracts();
  }

  applyContractTypeFilter(contractTypeId: string | ""): void {
    this.contractTypeFilter.set(contractTypeId);
    this.page.set(1);
    this.loadContracts();
  }

  /** A row's strip: what needs attention (unpaid, expiring, expired) shows. */
  rowColor(contract: Contract): string {
    if (contract.status === "expired") return "var(--color-danger)";
    if (contract.status === "cancelled") return "var(--color-muted)";
    if (contract.payment_status === "unpaid") return "var(--color-info)";
    return "var(--color-success)";
  }

  planCount(planId: string): number {
    return this.planCounts()[planId] ?? 0;
  }

  onPageChange(page: number): void {
    this.page.set(page);
    this.loadContracts();
  }

  resetFilters(): void {
    this.contractStatusFilter.set("");
    this.contractTypeFilter.set("");
    this.search.set("");
    this.page.set(1);
    this.loadContracts();
  }

  hasFilters(): boolean {
    return this.contractStatusFilter() !== "" || this.contractTypeFilter() !== "" || this.search() !== "";
  }

  // ---- what the dashboard sends people here to do -------------------------
  // Renewing and collecting used to mean opening the member's file from the
  // row you were already looking at. The row does both now.
  readonly rowBusy = signal<string | null>(null);

  async renew(contract: Contract): Promise<void> {
    if (this.rowBusy()) return;

    const confirmed = await this.confirm.ask({
      title: this.translate.instant("contracts.renew_confirm_title"),
      body: this.translate.instant("contracts.renew_confirm_body_for", { name: contract.client.full_name }),
    });
    if (!confirmed) return;

    this.rowBusy.set(contract.id);
    this.contractsService.renew(contract.id).subscribe({
      next: () => {
        this.rowBusy.set(null);
        this.toast.success(this.translate.instant("contracts.renewed"));
        this.loadContracts();
      },
      error: (err) => {
        this.rowBusy.set(null);
        this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }

  /**
   * Settles the period in full, in cash — the desk's overwhelming case. The
   * amount is deliberately not sent: the backend settles the payable, which
   * is the whole price or nothing (Fitora takes no part payments). Anything
   * else still goes through Encaissements.
   */
  collect(contract: Contract): void {
    if (this.rowBusy() || !contract.current_period_id) return;

    this.rowBusy.set(contract.id);
    this.paymentsService
      .record({ client_id: contract.client.id, payment_method: "cash", contract_period_id: contract.current_period_id })
      .subscribe({
        next: () => {
          this.rowBusy.set(null);
          this.toast.success(this.translate.instant("payments.recorded"));
          this.loadContracts();
        },
        error: (err) => {
          this.rowBusy.set(null);
          this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
        },
      });
  }

  readonly filterChips = computed(() => {
    const chips: { label: string; clear: () => void }[] = [];
    if (this.search()) chips.push({ label: `« ${this.search()} »`, clear: () => this.onSearchChange("") });
    const status = this.contractStatusFilter();
    if (status) {
      const opt = this.statusOptions.find((o) => o.value === status);
      if (opt) chips.push({ label: this.translate.instant(opt.labelKey), clear: () => this.applyContractFilter("") });
    }
    if (this.paymentFilter()) {
      chips.push({
        label: this.translate.instant("contracts.filter_unpaid"),
        clear: () => {
          this.paymentFilter.set("");
          this.page.set(1);
          this.loadContracts();
        },
      });
    }
    const planId = this.contractTypeFilter();
    if (planId) {
      const plan = this.plans().find((p) => p.id === planId);
      if (plan) chips.push({ label: plan.name, clear: () => this.applyContractTypeFilter("") });
    }
    return chips;
  });
}
