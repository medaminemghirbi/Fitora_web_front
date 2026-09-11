import { Component, OnInit, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { AdminSubscriptionPricingService, SubscriptionPricing } from "../../../core/services/admin-subscription-pricing.service";
import { ToastService } from "../../../core/services/toast.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import { PageHeaderComponent } from "../../../shared/ui/page-header.component";
import { SpinnerComponent } from "../../../shared/components/spinner.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";
import { MoneyPipe } from "../../../shared/pipes/money.pipe";

@Component({
  selector: "app-admin-pricing",
  standalone: true,
  imports: [FormsModule, TranslateModule, PageHeaderComponent, SpinnerComponent, ErrorStateComponent, MoneyPipe],
  templateUrl: "./pricing.component.html",
})
export class AdminPricingComponent implements OnInit {
  private readonly service = inject(AdminSubscriptionPricingService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly saving = signal(false);
  readonly pricing = signal<SubscriptionPricing | null>(null);

  readonly currency = signal("TND");
  readonly monthlyUnits = signal(0);
  readonly discount = signal(0);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.service.get(this.currency()).subscribe({
      next: (res) => {
        this.apply(res);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  onCurrencyChange(code: string): void {
    this.currency.set(code);
    this.load();
  }

  get dirty(): boolean {
    const p = this.pricing();
    if (!p) return false;
    return Math.round(this.monthlyUnits() * 100) !== p.monthly_cents || this.discount() !== p.annual_discount_percent;
  }

  save(): void {
    this.saving.set(true);
    this.service
      .update({
        currency: this.currency(),
        monthly_cents: Math.max(0, Math.round(this.monthlyUnits() * 100)),
        annual_discount_percent: this.discount(),
      })
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          this.apply(res);
          this.toast.success(this.translate.instant("common.save"));
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
        },
      });
  }

  private apply(res: SubscriptionPricing): void {
    this.pricing.set(res);
    this.currency.set(res.currency);
    this.monthlyUnits.set(res.monthly_cents / 100);
    this.discount.set(res.annual_discount_percent);
  }
}
