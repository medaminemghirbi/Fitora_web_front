import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslateModule } from "@ngx-translate/core";
import { Subject, of, throwError } from "rxjs";
import { AdminSubscriptionPricingService, SubscriptionPricing } from "../../../core/services/admin-subscription-pricing.service";
import { ToastService } from "../../../core/services/toast.service";
import { AdminPricingComponent } from "./pricing.component";

describe("AdminPricingComponent", () => {
  let fixture: ComponentFixture<AdminPricingComponent>;
  let component: AdminPricingComponent;
  let service: jasmine.SpyObj<AdminSubscriptionPricingService>;
  let toast: ToastService;

  const pricing: SubscriptionPricing = {
    currencies: ["TND", "EUR"],
    currency: "TND",
    monthly_cents: 15000,
    annual_discount_percent: 10,
    annual_cents: 162000,
    companies_count: 5,
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj<AdminSubscriptionPricingService>("AdminSubscriptionPricingService", ["get", "update"]);
    service.get.and.returnValue(of(pricing));

    await TestBed.configureTestingModule({
      imports: [AdminPricingComponent, TranslateModule.forRoot()],
      providers: [{ provide: AdminSubscriptionPricingService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminPricingComponent);
    component = fixture.componentInstance;
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it("loads pricing for the default currency on init and hydrates the form", () => {
    expect(service.get).toHaveBeenCalledWith("TND");
    expect(component.monthlyUnits()).toBe(150);
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
    const fresh = TestBed.createComponent(AdminPricingComponent);
    fresh.detectChanges();
    expect(fresh.componentInstance.dirty).toBe(false);
  });

  it("dirty is true once the monthly price or discount changes", () => {
    component.monthlyUnits.set(200);
    expect(component.dirty).toBe(true);
  });

  it("save() clamps a negative monthly price to 0 and shows a success toast", () => {
    component.monthlyUnits.set(-5);
    service.update.and.returnValue(of({ ...pricing, monthly_cents: 0 }));

    component.save();

    expect(service.update).toHaveBeenCalledWith({ currency: "TND", monthly_cents: 0, annual_discount_percent: 10 });
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
