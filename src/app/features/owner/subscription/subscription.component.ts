import { Component, computed, inject, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { Invoice } from "../../../core/models/subscription.model";
import { PayoutAccount, SubscriptionInfo, SubscriptionService } from "../../../core/services/subscription.service";
import { ToastService } from "../../../core/services/toast.service";
import { downloadBlob } from "../../../core/services/download.util";
import { extractErrorMessage } from "../../../core/services/error.util";
import { MoneyPipe } from "../../../shared/pipes/money.pipe";
import { SkeletonComponent } from "../../../shared/ui/skeleton.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";
import { LedgerCell, ledgerFor, ledgerYears as yearsFrom } from "../../../shared/utils/payment-ledger";

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

  // Years come from the invoices, so a gym of four years can open all four.
  readonly ledgerYears = computed(() => yearsFrom(this.invoices()));
  readonly ledger = computed<LedgerCell[]>(() => ledgerFor(this.ledgerYear(), this.invoices()));

  readonly paidCount = computed(() => this.ledger().filter((c) => c.state === "paid").length);

  // null until a RIB is configured on the host; the card then gives way to
  // the generic "settle with Fitora" line rather than showing empty fields.
  readonly payout = computed<PayoutAccount | null>(() => this.info()?.payout ?? null);

  /** Which field was just copied, so the button can say so for a moment. */
  readonly copied = signal<string | null>(null);

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

  /**
   * A RIB is 20-odd characters that have to be transcribed exactly; retyping
   * it into a banking app is where a payment goes to the wrong account.
   */
  copy(field: string, value: string | null): void {
    if (!value) return;

    navigator.clipboard?.writeText(value).then(
      () => {
        this.copied.set(field);
        setTimeout(() => this.copied.update((c) => (c === field ? null : c)), 2000);
      },
      () => this.toast.error(this.translate.instant("common.error_generic")),
    );
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
