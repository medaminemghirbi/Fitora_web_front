import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { AdminCompany, AdminCurrencyOption } from "../../../core/models/admin-company.model";
import { Invoice } from "../../../core/models/subscription.model";
import { AdminCompaniesService } from "../../../core/services/admin-companies.service";
import { AuthService } from "../../../core/auth/auth.service";
import { ToastService } from "../../../core/services/toast.service";
import { ConfirmService } from "../../../core/services/confirm.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import { MoneyPipe } from "../../../shared/pipes/money.pipe";
import { SpinnerComponent } from "../../../shared/components/spinner.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";
import { StatusBadgeComponent } from "../../../shared/components/status-badge.component";
import { LedgerCell, ledgerFor, ledgerYears as yearsFrom } from "../../../shared/utils/payment-ledger";

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
  private readonly confirm = inject(ConfirmService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly company = signal<AdminCompany | null>(null);
  readonly invoices = signal<Invoice[]>([]);

  readonly billingPeriod = signal<string>("monthly");
  readonly savingSub = signal(false);
  readonly savingInvoice = signal(false);

  readonly currencyOptions = signal<AdminCurrencyOption[]>([]);
  readonly localeOptions = signal<string[]>([]);
  readonly currency = signal<string>("TND");
  readonly appLocale = signal<string>("fr");
  readonly savingSettings = signal(false);

  readonly impersonating = signal(false);
  readonly ledgerYear = signal(new Date().getFullYear());

  private id!: string;

  // ---- the access, read not computed --------------------------------------
  readonly accessOpen = computed(() => this.company()?.subscription?.active ?? false);
  readonly lockReason = computed(() => this.company()?.subscription?.lock_reason ?? null);
  readonly paidThrough = computed(() => this.company()?.subscription?.paid_through ?? null);
  readonly currentPeriodPaid = computed(() => this.company()?.subscription?.current_period_paid ?? false);
  readonly daysBeforeLock = computed(() => this.company()?.subscription?.days_before_lock ?? null);
  readonly arrears = computed(() => (this.company()?.arrears_cents ?? 0) / 100);

  /**
   * The one thing this page is for, when there is one. A gym that is open
   * and paid up gets no banner at all.
   */
  readonly attention = computed<"suspended" | "unpaid" | "due" | null>(() => {
    if (!this.company()) return null;
    if (!this.accessOpen()) return this.lockReason() === "unpaid" ? "unpaid" : "suspended";
    return this.currentPeriodPaid() ? null : "due";
  });

  // ---- the ledger: every month of a year, and its invoice ------------------
  // Years come from the invoices, not from a window around today: a gym that
  // has been a client for four years has invoices a fixed window cannot reach.
  readonly ledgerYears = computed(() => yearsFrom(this.invoices()));
  readonly ledger = computed<LedgerCell[]>(() => ledgerFor(this.ledgerYear(), this.invoices()));

  readonly ledgerPaidCount = computed(() => this.ledger().filter((c) => c.state === "paid").length);
  readonly ledgerCollected = computed(() =>
    this.ledger().reduce((sum, c) => sum + (c.invoice ? c.invoice.amount : 0), 0)
  );

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get("id")!;
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.service.get(this.id).subscribe({
      next: (res) => {
        this.hydrate(res.company);
        this.currencyOptions.set(res.currency_options);
        this.localeOptions.set(res.locale_options);
        this.loading.set(false);
        this.loadInvoices();
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  private loadInvoices(): void {
    this.service.invoices(this.id).subscribe({
      next: (res) => this.invoices.set(res.invoices),
      error: () => this.invoices.set([]),
    });
  }

  private hydrate(company: AdminCompany): void {
    this.company.set(company);
    this.billingPeriod.set(company.subscription?.billing_period ?? "monthly");
    this.currency.set(company.currency);
    this.appLocale.set(company.locale);
  }

  // ---- the money arriving --------------------------------------------------
  issueInvoice(): void {
    if (this.savingInvoice()) return;

    this.savingInvoice.set(true);
    this.service.issueInvoice(this.id).subscribe({
      next: (res) => {
        this.savingInvoice.set(false);
        this.hydrate(res.company);
        this.loadInvoices();
        this.toast.success(this.translate.instant("admin.invoice_issued", { number: res.invoice.number }));
      },
      error: (err) => {
        this.savingInvoice.set(false);
        this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }

  async voidInvoice(invoice: Invoice): Promise<void> {
    if (this.savingInvoice()) return;

    const confirmed = await this.confirm.ask({
      title: this.translate.instant("admin.void_invoice_title"),
      body: this.translate.instant("admin.void_invoice_body", { number: invoice.number }),
      danger: true,
    });
    if (!confirmed) return;

    this.savingInvoice.set(true);
    this.service.voidInvoice(this.id, invoice.id).subscribe({
      next: (res) => {
        this.savingInvoice.set(false);
        this.hydrate(res.company);
        this.loadInvoices();
      },
      error: (err) => {
        this.savingInvoice.set(false);
        this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }

  // ---- access, and what an invoice covers ---------------------------------
  toggleAccess(): void {
    this.updateSubscription({ active: !this.accessOpen() }, this.accessOpen() ? "admin.access_suspended" : "admin.access_restored");
  }

  changeBillingPeriod(period: string): void {
    this.billingPeriod.set(period);
    this.updateSubscription({ billing_period: period }, "common.saved");
  }

  private updateSubscription(payload: Parameters<AdminCompaniesService["updateSubscription"]>[1], successKey: string): void {
    if (this.savingSub()) return;

    this.savingSub.set(true);
    this.service.updateSubscription(this.id, payload).subscribe({
      next: (res) => {
        this.savingSub.set(false);
        this.hydrate(res.company);
        this.toast.success(this.translate.instant(successKey));
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
        this.toast.success(this.translate.instant("common.saved"));
      },
      error: (err) => {
        this.savingSettings.set(false);
        this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }

  readonly settingsDirty = computed(() => {
    const c = this.company();
    if (!c) return false;
    return this.currency() !== c.currency || this.appLocale() !== c.locale;
  });

  impersonate(): void {
    this.impersonating.set(true);
    const name = this.company()?.name ?? "";
    this.service.impersonate(this.id).subscribe({
      next: (res) => {
        this.impersonating.set(false);
        this.auth.startImpersonation(res, name);
      },
      error: (err) => {
        this.impersonating.set(false);
        this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }
}
