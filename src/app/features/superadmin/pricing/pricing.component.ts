import { Component, OnInit, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import {
  SuperadminSubscriptionPricingService,
  SubscriptionPricing,
  UNLIMITED_TIER,
} from "../../../core/services/superadmin-subscription-pricing.service";
import { ToastService } from "../../../core/services/toast.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import { SpinnerComponent } from "../../../shared/components/spinner.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";
import { MoneyPipe } from "../../../shared/pipes/money.pipe";

interface TierRow {
  companyLimit: number;
  unlimited: boolean;
  labelKey: string;
  monthlyUnits: number;
  annualCents: number;
}

@Component({
  selector: "app-superadmin-pricing",
  standalone: true,
  imports: [FormsModule, TranslateModule, SpinnerComponent, ErrorStateComponent, MoneyPipe],
  templateUrl: "./pricing.component.html",
})
export class SuperadminPricingComponent implements OnInit {
  private readonly service = inject(SuperadminSubscriptionPricingService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly saving = signal(false);
  readonly pricing = signal<SubscriptionPricing | null>(null);

  readonly currency = signal("TND");
  readonly discount = signal(0);
  readonly tiers = signal<TierRow[]>([]);

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

  tierLabelKey(companyLimit: number, unlimited: boolean): string {
    if (unlimited) return "superadmin.pricing_tier_unlimited";
    return companyLimit === 1 ? "superadmin.pricing_tier_one" : "superadmin.pricing_tier_many";
  }

  get dirty(): boolean {
    const p = this.pricing();
    if (!p) return false;
    if (this.discount() !== p.annual_discount_percent) return true;

    return this.tiers().some((row) => {
      const original = p.tiers.find((t) => t.company_limit === row.companyLimit);
      return !original || Math.round(row.monthlyUnits * 100) !== original.monthly_cents;
    });
  }

  save(): void {
    this.saving.set(true);

    const tierPayload: Record<string, number> = {};
    this.tiers().forEach((row) => {
      tierPayload[String(row.companyLimit)] = Math.max(0, Math.round(row.monthlyUnits * 100));
    });

    this.service
      .update({ currency: this.currency(), tiers: tierPayload, annual_discount_percent: this.discount() })
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
    this.discount.set(res.annual_discount_percent);
    this.tiers.set(
      res.tiers.map((t) => ({
        companyLimit: t.company_limit,
        unlimited: t.unlimited || t.company_limit === UNLIMITED_TIER,
        labelKey: this.tierLabelKey(t.company_limit, t.unlimited),
        monthlyUnits: t.monthly_cents / 100,
        annualCents: t.annual_cents,
      }))
    );
  }
}
