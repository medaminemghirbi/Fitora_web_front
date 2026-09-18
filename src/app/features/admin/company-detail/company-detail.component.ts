import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { Observable } from "rxjs";
import { DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { AdminCompany, AdminCurrencyOption } from "../../../core/models/admin-company.model";
import { AdminCompaniesService } from "../../../core/services/admin-companies.service";
import { AuthService } from "../../../core/auth/auth.service";
import { ToastService } from "../../../core/services/toast.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import { MoneyPipe } from "../../../shared/pipes/money.pipe";
import { SpinnerComponent } from "../../../shared/components/spinner.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";
import { StatusBadgeComponent } from "../../../shared/components/status-badge.component";

const STATUSES = ["active", "inactive", "expired", "cancelled"] as const;

@Component({
  selector: "app-admin-company-detail",
  standalone: true,
  imports: [FormsModule, DatePipe, RouterLink, TranslateModule, MoneyPipe, SpinnerComponent, ErrorStateComponent, StatusBadgeComponent],
  templateUrl: "./company-detail.component.html",
  styleUrl: "./company-detail.component.scss",
})
export class AdminCompanyDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(AdminCompaniesService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly company = signal<AdminCompany | null>(null);

  readonly statuses = STATUSES;

  // subscription form
  readonly status = signal<string>("active");
  readonly expiresAt = signal<string>("");
  // "" = still a free trial (no billing period), "monthly" | "yearly" = active plan
  readonly billingPeriod = signal<string>("");
  readonly savingSub = signal(false);

  // tenant settings (currency + language)
  readonly currencyOptions = signal<AdminCurrencyOption[]>([]);
  readonly localeOptions = signal<string[]>([]);
  readonly currency = signal<string>("TND");
  readonly appLocale = signal<string>("fr");
  readonly savingSettings = signal(false);

  // debt — displayed/edited in whole currency units, stored in cents
  readonly debtAmount = signal<number>(0);
  readonly savingDebt = signal(false);

  readonly impersonating = signal(false);

  private id!: string;

  // ---- what needs deciding, said in one line ------------------------------
  // The page used to make you read three controls and a date to work out
  // whether a gym was fine, running out, or already locked out.
  readonly askedAt = computed(() => this.company()?.subscription?.upgrade_requested_at ?? null);
  readonly askedPeriod = computed(() => this.company()?.subscription?.upgrade_requested_period ?? null);

  /** Whole days since they asked to carry on. */
  readonly waitingDays = computed(() => {
    const asked = this.askedAt();
    if (!asked) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(asked).getTime()) / 86_400_000));
  });

  /**
   * The one thing this page is for, when there is one. `null` means nothing
   * is pending and the banner stays off — a paying gym in good standing
   * should not be shouted at.
   */
  readonly attention = computed<"asked" | "overdue" | "due" | "locked" | "ending" | null>(() => {
    const c = this.company();
    if (!c) return null;
    const sub = c.subscription;
    if (this.askedAt()) return "asked";
    // Money owed outranks a deadline: it is the reason the door is shut and
    // the one thing an admin can fix from here.
    if (sub?.payment_overdue) return "overdue";
    if (sub && !sub.on_trial && !sub.current_period_paid) return "due";
    if (c.trial_locked) return "locked";
    const days = c.trial_days_remaining;
    if (days !== null && days <= 7 && !sub?.billing_period) return "ending";
    return null;
  });

  // ---- the month's payment ------------------------------------------------
  readonly savingPayment = signal(false);

  readonly paidThrough = computed(() => this.company()?.subscription?.paid_through ?? null);
  readonly currentPeriodPaid = computed(() => this.company()?.subscription?.current_period_paid ?? false);
  readonly daysBeforeLock = computed(() => this.company()?.subscription?.days_before_lock ?? null);
  /** The payment controls mean nothing while a gym is still on its trial. */
  readonly onPaidPlan = computed(() => {
    const sub = this.company()?.subscription;
    return !!sub && !sub.on_trial;
  });

  recordPayment(): void {
    if (this.savingPayment()) return;
    this.runPayment(this.service.recordPayment(this.id), "admin.payment_recorded");
  }

  undoPayment(): void {
    if (this.savingPayment()) return;
    this.runPayment(this.service.undoPayment(this.id), "admin.payment_undone");
  }

  private runPayment(call: Observable<{ company: AdminCompany }>, successKey: string): void {
    this.savingPayment.set(true);
    call.subscribe({
      next: (res) => {
        this.savingPayment.set(false);
        this.hydrate(res.company);
        this.toast.success(this.translate.instant(successKey));
      },
      error: (err) => {
        this.savingPayment.set(false);
        this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }

  /**
   * Activation in one action: their preferred period, no end date, active.
   * Clearing expires_at is what unlocks them (see the backend's
   * update_subscription) — the three controls below still do it by hand for
   * anything unusual, like a fixed renewal date.
   */
  activate(): void {
    const period = this.askedPeriod() || "monthly";
    this.savingSub.set(true);
    this.service.updateSubscription(this.id, { status: "active", expires_at: null, billing_period: period }).subscribe({
      next: (res) => {
        this.savingSub.set(false);
        this.hydrate(res.company);
        this.toast.success(this.translate.instant("admin.activated"));
      },
      error: (err) => {
        this.savingSub.set(false);
        this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }

  // Summary tile: the current plan (or "free trial" while no billing period).
  readonly formuleLabelKey = computed(() => {
    const period = this.company()?.subscription?.billing_period;
    if (period === "yearly") return "subscription.plan_yearly";
    if (period === "monthly") return "subscription.plan_monthly";
    return "admin.formule_trial";
  });

  readonly subDirty = computed(() => {
    const c = this.company();
    if (!c) return false;
    return (
      this.status() !== (c.subscription?.status ?? "active") ||
      this.expiresAt() !== (c.subscription?.expires_at?.slice(0, 10) ?? "") ||
      this.billingPeriod() !== (c.subscription?.billing_period ?? "")
    );
  });

  readonly settingsDirty = computed(() => {
    const c = this.company();
    if (!c) return false;
    return this.currency() !== c.currency || this.appLocale() !== c.locale;
  });

  readonly debtDirty = computed(() => {
    const c = this.company();
    if (!c) return false;
    return this.debtAmount() !== c.debt_cents / 100;
  });

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get("id")!;
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.service.get(this.id).subscribe({
      next: (res) => {
        this.currencyOptions.set(res.currency_options ?? []);
        this.localeOptions.set(res.locale_options ?? []);
        this.hydrate(res.company);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  private hydrate(c: AdminCompany): void {
    this.company.set(c);
    this.status.set(c.subscription?.status ?? "active");
    this.expiresAt.set(c.subscription?.expires_at?.slice(0, 10) ?? "");
    this.billingPeriod.set(c.subscription?.billing_period ?? "");
    this.currency.set(c.currency);
    this.appLocale.set(c.locale);
    this.debtAmount.set(c.debt_cents / 100);
  }

  saveSubscription(): void {
    this.savingSub.set(true);
    this.service.updateSubscription(this.id, { status: this.status(), expires_at: this.expiresAt() || null, billing_period: this.billingPeriod() || null }).subscribe({
      next: (res) => {
        this.savingSub.set(false);
        this.hydrate(res.company);
        this.toast.success(this.translate.instant("common.save"));
      },
      error: (err) => {
        this.savingSub.set(false);
        this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }

  saveSettings(): void {
    this.savingSettings.set(true);
    this.service.updateSettings(this.id, { currency: this.currency(), locale: this.appLocale() }).subscribe({
      next: (res) => {
        this.savingSettings.set(false);
        this.hydrate(res.company);
        this.toast.success(this.translate.instant("common.save"));
      },
      error: (err) => {
        this.savingSettings.set(false);
        this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }

  saveDebt(): void {
    this.savingDebt.set(true);
    this.service.updateDebt(this.id, Math.round(this.debtAmount() * 100)).subscribe({
      next: (res) => {
        this.savingDebt.set(false);
        this.hydrate(res.company);
        this.toast.success(this.translate.instant("common.save"));
      },
      error: (err) => {
        this.savingDebt.set(false);
        this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }

  impersonate(): void {
    const c = this.company();
    if (!c) return;
    this.impersonating.set(true);
    this.service.impersonate(c.id).subscribe({
      next: (res) => this.auth.startImpersonation(res, c.name),
      error: (err) => {
        this.impersonating.set(false);
        this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }
}
