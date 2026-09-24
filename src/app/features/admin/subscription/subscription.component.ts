import { Component, computed, inject, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { SubscriptionInfo, SubscriptionService } from "../../../core/services/subscription.service";
import { SupportTicketsService } from "../../../core/services/support-tickets.service";
import { AuthService } from "../../../core/auth/auth.service";
import { ConfigurationService } from "../../../core/configuration/configuration.service";
import { isValidPhone } from "../../../shared/utils/phone";
import { ToastService } from "../../../core/services/toast.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import { moduleIcon } from "../../../core/configuration/module-icons";
import { MoneyPipe } from "../../../shared/pipes/money.pipe";
import { ModalComponent } from "../../../shared/components/modal.component";
import { SpinnerComponent } from "../../../shared/components/spinner.component";
import { SkeletonComponent } from "../../../shared/ui/skeleton.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";

/** Where a tier stands on one feature. */
export type Availability = "yes" | "no" | "soon";

/** The three tiers, in the order the backend prices them. */
type TierKey = "1" | "3" | "unlimited";

/** A column of the comparison: a tier, or the free trial ahead of them. */
type ColumnKey = TierKey | "trial";

/**
 * The comparison, one row per feature.
 *
 * "soon" is the honest half: these are the multi-gym features a tier is sold
 * on, and the ones still being built say so in the cell instead of reading as
 * available tonight. Drop the flag to "yes" as each one ships.
 *
 * The six modules are not listed here — they come from the payload's
 * `included_modules`, and every tier carries all of them.
 */
const FEATURE_MATRIX: { labelKey: string; rows: { key: string; values: Record<TierKey, Availability> }[] }[] = [
  {
    labelKey: "subscription.cmp_group_network",
    rows: [
      { key: "consolidated", values: { "1": "no", "3": "soon", unlimited: "soon" } },
      { key: "network_pass", values: { "1": "no", "3": "soon", unlimited: "soon" } },
      { key: "shared_team", values: { "1": "no", "3": "soon", unlimited: "soon" } },
      { key: "shared_catalogue", values: { "1": "no", "3": "soon", unlimited: "soon" } },
      { key: "per_gym_branding", values: { "1": "no", "3": "yes", unlimited: "yes" } },
    ],
  },
  {
    labelKey: "subscription.cmp_group_advanced",
    rows: [
      { key: "audit_log", values: { "1": "no", "3": "no", unlimited: "soon" } },
      { key: "api", values: { "1": "no", "3": "no", unlimited: "soon" } },
      { key: "priority_support", values: { "1": "no", "3": "no", unlimited: "yes" } },
    ],
  },
];

/** One tier as the table shows it — priced, named, and comparable. */
export interface TierCard {
  limit: number | null;
  nameKey: string;
  price: number;
  current: boolean;
  /** The free trial's column: no price, a length instead of a salle count. */
  trial: boolean;
}

/** One row of the comparison: a feature, and where each tier stands on it. */
export interface CompareRow {
  key: string;
  labelKey: string;
  values: Availability[];
}

export interface CompareGroup {
  labelKey: string;
  rows: CompareRow[];
}

/**
 * The gym's own view of its Gymly access: whether it is open, until when,
 * what it is using, and what every tier costs.
 *
 * Read-only by design — there is nothing to ask for. The gym settles with
 * Gymly directly and Gymly confirms.
 *
 * The month-by-month invoice ledger, the invoice table and the bank details
 * were removed on request. The endpoint still returns `invoices` and
 * `payout`; nothing here reads them.
 */
@Component({
  selector: "app-subscription",
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    TranslateModule,
    MoneyPipe,
    ModalComponent,
    SpinnerComponent,
    SkeletonComponent,
    ErrorStateComponent,
  ],
  templateUrl: "./subscription.component.html",
  styleUrl: "./subscription.component.scss",
})
export class SubscriptionComponent {
  private readonly service = inject(SubscriptionService);
  private readonly tickets = inject(SupportTicketsService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly auth = inject(AuthService);
  private readonly config = inject(ConfigurationService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly info = signal<SubscriptionInfo | null>(null);

  readonly sub = computed(() => this.info()?.subscription ?? null);
  readonly accessOpen = computed(() => this.sub()?.active ?? false);
  readonly paidThrough = computed(() => this.sub()?.paid_through ?? null);
  readonly currentPeriodPaid = computed(() => this.sub()?.current_period_paid ?? false);
  readonly daysBeforeLock = computed(() => this.sub()?.days_before_lock ?? null);
  readonly arrears = computed(() => (this.info()?.arrears_cents ?? 0) / 100);
  readonly currency = computed(() => this.info()?.currency ?? "TND");

  // ---- the free trial -----------------------------------------------------
  // A new gym has paid nothing and chosen nothing. It used to be shown on
  // Solo only because Solo is the default salle cap; now it is shown as what
  // it is, until a first payment makes a tier current.
  readonly onTrial = computed(() => this.sub()?.trial ?? false);
  readonly trialDaysLeft = computed(() => this.sub()?.trial_days_left ?? 0);
  /** Free days still ahead and the door still open. */
  readonly trialRunning = computed(() => this.onTrial() && this.accessOpen() && this.trialDaysLeft() > 0);
  readonly trialOver = computed(() => this.onTrial() && !this.trialRunning());

  // ---- the tiers ----------------------------------------------------------
  // The payload has carried the full tier comparison all along and nothing
  // rendered it: an admin could see what they pay but never what the next
  // tier costs. Prices are real SubscriptionPrice rows in the gym's own
  // currency, so nothing here is invented.
  readonly billingPeriod = signal<"monthly" | "yearly">("monthly");

  readonly tiers = computed<TierCard[]>(() => {
    const info = this.info();
    const paid = (info?.company_tiers ?? []).map((tier) => ({
      limit: tier.company_limit,
      // "Solo" / "Club" / "Réseau" — named by what they allow, not by a number.
      nameKey: tier.company_limit === null ? "subscription.tier_unlimited" : `subscription.tier_${tier.company_limit}`,
      price: (this.billingPeriod() === "yearly" ? tier.annual_cents : tier.monthly_cents) / 100,
      // The admin's tier is the one whose limit matches theirs, unlimited
      // included — both sides use null for it. Nothing is chosen on trial.
      current: !this.onTrial() && tier.company_limit === (info?.company_limit ?? null),
      trial: false,
    }));

    if (!this.trialRunning() || !paid.length) return paid;

    // While it lasts, the trial leads the table as where the gym stands:
    // free, and the whole product.
    const trial: TierCard = {
      limit: info?.company_limit ?? null,
      nameKey: "subscription.tier_trial",
      price: 0,
      current: true,
      trial: true,
    };
    return [trial, ...paid];
  });

  readonly currentTierName = computed(() => {
    if (this.trialRunning()) return "subscription.tier_trial";
    if (this.trialOver()) return "subscription.tier_trial_over";
    return this.tiers().find((t) => t.current)?.nameKey ?? "subscription.tier_1";
  });

  /** What this gym is using against what its tier allows. */
  readonly usage = computed(() => {
    const info = this.info();
    if (!info) return [];

    return [
      {
        key: "companies",
        icon: "bi-building",
        value: info.company_limit === null ? String(info.companies_count) : `${info.companies_count} / ${info.company_limit}`,
      },
      { key: "staff", icon: "bi-person-badge", value: String(info.staff_used) },
      { key: "clients", icon: "bi-people", value: String(info.clients_used) },
    ];
  });

  /**
   * The modules the backend reports as included. Every tier carries all of
   * them — the comparison says so explicitly rather than leaving the reader
   * to assume the cheapest tier is a stripped one.
   */
  readonly features = computed(() =>
    (this.info()?.included_modules ?? []).map((key) => ({
      key,
      icon: moduleIcon(key),
      nameKey: `modules.${key}.name`,
    }))
  );

  /**
   * The comparison, in the same column order as `tiers()`: one group for the
   * modules everybody gets, then what multi-gym and the top tier add.
   */
  readonly compareGroups = computed<CompareGroup[]>(() => {
    const keys = this.tiers().map((t): ColumnKey =>
      t.trial ? "trial" : ((t.limit === null ? "unlimited" : String(t.limit)) as TierKey)
    );
    if (!keys.length) return [];

    const included: CompareGroup = {
      labelKey: "subscription.cmp_group_included",
      rows: this.features().map((f) => ({
        key: f.key,
        labelKey: f.nameKey,
        values: keys.map(() => "yes" as Availability),
      })),
    };

    const rest = FEATURE_MATRIX.map((group) => ({
      labelKey: group.labelKey,
      rows: group.rows.map((row) => ({
        key: row.key,
        labelKey: `subscription.extra_${row.key}`,
        // The trial is the whole product, so it reads the top tier's column.
        values: keys.map((k) => row.values[k === "trial" ? "unlimited" : k]),
      })),
    }));

    return included.rows.length ? [included, ...rest] : rest;
  });

  // ---- asking to change tier ---------------------------------------------
  // Payment happens outside the app, so "upgrading" is a conversation, not a
  // transaction. The request rides on the support ticket the admin can
  // already send and read back on /admin/support, rather than a second inbox
  // that would have to be watched separately.
  readonly requestTier = signal<TierCard | null>(null);
  readonly requestNote = signal("");
  /**
   * Required: Gymly calls back to set the plan up, since payment happens
   * off-app. The backend refuses a plan request without one too.
   */
  readonly requestPhone = signal("");
  /** Set on the first send attempt, so the field is not red before it is touched. */
  readonly phoneTouched = signal(false);
  readonly phoneValid = computed(() => isValidPhone(this.requestPhone()));
  readonly requesting = signal(false);
  /** Set once sent, so the page stops offering what was just asked for. */
  readonly requestedTiers = signal<string[]>([]);

  openRequest(tier: TierCard): void {
    this.requestTier.set(tier);
    this.requestNote.set("");
    // Most admins already gave a number somewhere: theirs first, then the
    // gym's. Still editable — the best number to reach them on may differ.
    this.requestPhone.set(this.auth.currentUser()?.phone ?? this.config.company()?.phone ?? "");
    this.phoneTouched.set(false);
  }

  closeRequest(): void {
    if (this.requesting()) return;
    this.requestTier.set(null);
  }

  requested(tier: TierCard): boolean {
    return this.requestedTiers().includes(tier.nameKey);
  }

  submitRequest(): void {
    const tier = this.requestTier();
    if (!tier || this.requesting()) return;

    this.phoneTouched.set(true);
    if (!this.phoneValid()) return;
    const phone = this.requestPhone().trim();

    const tierName = this.translate.instant(tier.nameKey);
    const period = this.translate.instant(
      this.billingPeriod() === "yearly" ? "subscription.plan_yearly" : "subscription.plan_monthly"
    );
    const subject = this.translate.instant("subscription.request_subject", { tier: tierName, period });
    const body = this.translate.instant("subscription.request_body", {
      tier: tierName,
      period,
      limit:
        tier.limit === null
          ? this.translate.instant("subscription.tier_limit_unlimited")
          : this.translate.instant(`subscription.tier_limit${tier.limit === 1 ? "" : "_plural"}`, { count: tier.limit }),
    });
    const note = this.requestNote().trim();

    this.requesting.set(true);
    this.tickets.create(subject, note ? `${body}\n\n${note}` : body, [], { kind: "upgrade", contact_phone: phone }).subscribe({
      next: () => {
        this.requesting.set(false);
        this.requestTier.set(null);
        this.requestedTiers.update((list) => [...list, tier.nameKey]);
        this.toast.success(this.translate.instant("subscription.request_sent"));
      },
      error: (err) => {
        this.requesting.set(false);
        this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.service.get().subscribe({
      next: (info) => {
        this.info.set(info);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
