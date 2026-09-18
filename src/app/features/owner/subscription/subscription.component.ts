import { Component, computed, inject, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { Invoice } from "../../../core/models/subscription.model";
import { SubscriptionInfo, SubscriptionService } from "../../../core/services/subscription.service";
import { ToastService } from "../../../core/services/toast.service";
import { downloadBlob } from "../../../core/services/download.util";
import { extractErrorMessage } from "../../../core/services/error.util";
import { MoneyPipe } from "../../../shared/pipes/money.pipe";
import { PageHeaderComponent } from "../../../shared/ui/page-header.component";
import { SkeletonComponent } from "../../../shared/ui/skeleton.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";

/** One month of the year, and the invoice covering it if there is one. */
interface LedgerCell {
  label: string;
  state: "paid" | "missed" | "current" | "future";
  invoice: Invoice | null;
}

/**
 * The gym's own view of its Fitora access.
 *
 * Read-only by design: there is nothing to ask for. The gym settles with
 * Fitora directly, Fitora confirms, and the invoice appears here. What used
 * to be a request form is now a year of invoices, each one downloadable.
 */
@Component({
  selector: "app-subscription",
  standalone: true,
  imports: [
    DatePipe,
    TranslateModule,
    MoneyPipe,
    PageHeaderComponent,
    SkeletonComponent,
    ErrorStateComponent,
    EmptyStateComponent,
  ],
  templateUrl: "./subscription.component.html",
  styleUrl: "./subscription.component.scss",
})
export class SubscriptionComponent {
  private readonly service = inject(SubscriptionService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly info = signal<SubscriptionInfo | null>(null);
  readonly downloading = signal<string | null>(null);
  readonly ledgerYear = signal(new Date().getFullYear());

  readonly sub = computed(() => this.info()?.subscription ?? null);
  readonly invoices = computed(() => this.info()?.invoices ?? []);
  readonly accessOpen = computed(() => this.sub()?.active ?? false);
  readonly paidThrough = computed(() => this.sub()?.paid_through ?? null);
  readonly currentPeriodPaid = computed(() => this.sub()?.current_period_paid ?? false);
  readonly daysBeforeLock = computed(() => this.sub()?.days_before_lock ?? null);
  readonly arrears = computed(() => (this.info()?.arrears_cents ?? 0) / 100);
  readonly currency = computed(() => this.info()?.currency ?? "TND");

  readonly ledgerYears = computed(() => {
    const now = new Date().getFullYear();
    return [now - 1, now, now + 1];
  });

  readonly ledger = computed<LedgerCell[]>(() => {
    const year = this.ledgerYear();
    const today = new Date();
    const labels = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

    return labels.map((label, month) => {
      // A yearly invoice covers twelve of these at once — the cell asks
      // whether any invoice's period contains its first day.
      const first = new Date(Date.UTC(year, month, 1));
      const covering = this.invoices().find(
        (i) => new Date(i.period_start) <= first && new Date(i.period_end) >= first
      );
      if (covering) return { label, state: "paid" as const, invoice: covering };

      const isFuture = year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth());
      if (isFuture) return { label, state: "future" as const, invoice: null };

      const isCurrent = year === today.getFullYear() && month === today.getMonth();
      return { label, state: isCurrent ? ("current" as const) : ("missed" as const), invoice: null };
    });
  });

  readonly paidCount = computed(() => this.ledger().filter((c) => c.state === "paid").length);

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

  showYear(year: number): void {
    this.ledgerYear.set(year);
  }

  download(invoice: Invoice | null): void {
    if (!invoice || this.downloading()) return;

    this.downloading.set(invoice.id);
    this.service.downloadInvoice(invoice.id).subscribe({
      next: (blob) => {
        this.downloading.set(null);
        downloadBlob(blob, `${invoice.number}.pdf`);
      },
      error: (err) => {
        this.downloading.set(null);
        this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }
}
