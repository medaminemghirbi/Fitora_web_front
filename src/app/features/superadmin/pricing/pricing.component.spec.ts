import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslateModule } from "@ngx-translate/core";
import { Subject, of, throwError } from "rxjs";
import { SuperadminSubscriptionPricingService, SubscriptionPricing } from "../../../core/services/superadmin-subscription-pricing.service";
import { ToastService } from "../../../core/services/toast.service";
import { SuperadminPricingComponent } from "./pricing.component";

describe("SuperadminPricingComponent", () => {
  let fixture: ComponentFixture<SuperadminPricingComponent>;
  let component: SuperadminPricingComponent;
  let service: jasmine.SpyObj<SuperadminSubscriptionPricingService>;
  let toast: ToastService;

  const pricing: SubscriptionPricing = {
    currencies: ["TND", "EUR"],
    currency: "TND",
    annual_discount_percent: 10,
    companies_count: 5,
    tiers: [
      { company_limit: 1, unlimited: false, monthly_cents: 15000, annual_cents: 162000 },
      { company_limit: 3, unlimited: false, monthly_cents: 37500, annual_cents: 405000 },
      { company_limit: 0, unlimited: true, monthly_cents: 75000, annual_cents: 810000 },
    ],
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj<SuperadminSubscriptionPricingService>("SuperadminSubscriptionPricingService", ["get", "update"]);
    service.get.and.returnValue(of(pricing));

    await TestBed.configureTestingModule({
      imports: [SuperadminPricingComponent, TranslateModule.forRoot()],
      providers: [{ provide: SuperadminSubscriptionPricingService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(SuperadminPricingComponent);
    component = fixture.componentInstance;
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it("loads pricing for the default currency on init and hydrates all three tier rows" , () => {
    expect(service.get).toHaveBeenCalledWith("TND");
    expect(component.tiers().map((t) => t.monthlyUnits)).toEqual([ 150, 375, 750 ]);
    expect(component.discount()).toBe(10);
    expect(component.loading()).toBe(false);
  });

  it("sets the error flag when loading fails", () => {
    service.get.and.returnValue(throwError(() => new Error("nope")));
    component.load();
    expect(component.error()).toBe(true);
  });

  it("onCurrencyChange reloads pricing for the new currency", () => {
    component.onCurrencyChange("EUR");
    expect(service.get).toHaveBeenCalledWith("EUR");
  });

  it("dirty is false right after loading", () => {
    expect(component.dirty).toBe(false);
  });

  it("dirty is false before pricing has ever loaded", () => {
    const pending = new Subject<SubscriptionPricing>();
    service.get.and.returnValue(pending);
    const fresh = TestBed.createComponent(SuperadminPricingComponent);
    fresh.detectChanges();
    expect(fresh.componentInstance.dirty).toBe(false);
  });

  it("dirty is true once any tier's price or the discount changes", () => {
    component.tiers()[0].monthlyUnits = 200;
    expect(component.dirty).toBe(true);
  });

  it("save() sends every tier's price keyed by company_limit, clamping negatives to 0" , () => {
    component.tiers()[0].monthlyUnits = -5;
    service.update.and.returnValue(of(pricing));

    component.save();

    expect(service.update).toHaveBeenCalledWith({
      currency: "TND",
      tiers: { "1": 0, "3": 37500, "0": 75000 },
      annual_discount_percent: 10,
    });
    expect(component.saving()).toBe(false);
    expect(toast.toasts()[0].kind).toBe("success");
  });

  it("save() shows an error toast on failure", () => {
    service.update.and.returnValue(throwError(() => new Error("nope")));
    component.save();
    expect(component.saving()).toBe(false);
    expect(toast.toasts()[0].kind).toBe("error");
  });
});
