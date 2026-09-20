import { Component, computed, inject, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { TranslateModule } from "@ngx-translate/core";
import { SubscriptionInfo, SubscriptionService } from "../../../core/services/subscription.service";
import { MoneyPipe } from "../../../shared/pipes/money.pipe";
import { SkeletonComponent } from "../../../shared/ui/skeleton.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";

/**
 * The gym's own view of its Fitora access: whether it is open, until when,
 * what it is using, and what every tier costs.
 *
 * Read-only by design — there is nothing to ask for. The gym settles with
 * Fitora directly and Fitora confirms.
 *
 * The month-by-month invoice ledger, the invoice table and the bank details
 * were removed on request. The endpoint still returns `invoices` and
 * `payout`; nothing here reads them.
 */
@Component({
  selector: "app-subscription",
  standalone: true,
  imports: [
    DatePipe,
    TranslateModule,
    MoneyPipe,
    SkeletonComponent,
    ErrorStateComponent,
  ],
  templateUrl: "./subscription.component.html",
  styleUrl: "./subscription.component.scss",
})
export class SubscriptionComponent {
  private readonly service = inject(SubscriptionService);

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

  // ---- the tiers ----------------------------------------------------------
  // The payload has carried the full tier comparison all along and nothing
  // rendered it: an owner could see what they pay but never what the next
  // tier costs. Prices are real SubscriptionPrice rows in the gym's own
  // currency, so nothing here is invented.
  readonly billingPeriod = signal<"monthly" | "yearly">("monthly");

  readonly tiers = computed(() =>
    (this.info()?.company_tiers ?? []).map((tier) => ({
      limit: tier.company_limit,
      // "Solo" / "Club" / "Réseau" — named by what they allow, not by a number.
      nameKey: tier.company_limit === null ? "subscription.tier_unlimited" : `subscription.tier_${tier.company_limit}`,
      price: (this.billingPeriod() === "yearly" ? tier.annual_cents : tier.monthly_cents) / 100,
      // The owner's tier is the one whose limit matches theirs, unlimited
      // included — both sides use null for it.
      current: tier.company_limit === (this.info()?.company_limit ?? null),
    }))
  );

  readonly currentTierName = computed(
    () => this.tiers().find((t) => t.current)?.nameKey ?? "subscription.tier_1"
  );

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
