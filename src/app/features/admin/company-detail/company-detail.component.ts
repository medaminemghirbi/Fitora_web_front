import { Component, OnInit, computed, inject, signal } from "@angular/core";
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

  readonly upgradeRequest = computed(() => {
    const sub = this.company()?.subscription;
    return sub?.upgrade_requested_at ? { at: sub.upgrade_requested_at, period: sub.upgrade_requested_period } : null;
  });

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
