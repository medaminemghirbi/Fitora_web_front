import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { SubscriptionInfo, SubscriptionService } from "../../../core/services/subscription.service";
import { SubscriptionComponent } from "./subscription.component";

describe("SubscriptionComponent", () => {
  let fixture: ComponentFixture<SubscriptionComponent>;
  let component: SubscriptionComponent;
  let service: jasmine.SpyObj<SubscriptionService>;


  function build(patch: Partial<SubscriptionInfo> = {}): void {
    TestBed.resetTestingModule();
    service = jasmine.createSpyObj<SubscriptionService>("SubscriptionService", ["get"]);
    service.get.and.returnValue(
      of({
        subscription: {
          id: "s1",
          active: true,
          billing_period: "monthly",
          lock_reason: null,
          paid_through: "2099-12-31",
          current_period_paid: true,
          days_before_lock: null,
        },
        invoices: [],
        clients_used: 10,
        staff_used: 2,
        currency: "TND",
        currency_symbol: "DT",
        monthly_subscription_cents: 9900,
        annual_subscription_cents: 100_980,
        annual_discount_percent: 15,
        arrears_cents: 0,
        included_modules: [],
        company_limit: 1,
        companies_count: 1,
        company_limit_reached: true,
        company_tiers: [],
        payout: null,
        ...patch,
      } as SubscriptionInfo)
    );

    TestBed.configureTestingModule({
      imports: [SubscriptionComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SubscriptionService, useValue: service },
      ],
    });

    fixture = TestBed.createComponent(SubscriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => build());

  it("reads access as the boolean it is", () => {
    expect(component.accessOpen()).toBe(true);
    expect(component.currentPeriodPaid()).toBe(true);
  });

  it("sets the error flag when loading fails", () => {
    service.get.and.returnValue(throwError(() => new Error("nope")));
    component.load();
    expect(component.error()).toBe(true);
  });

  it("reports what is owed from the server, never from a typed-in field", () => {
    build({ arrears_cents: 19_800 });
    expect(component.arrears()).toBe(198);
  });

  describe("the tiers", () => {
    function withTiers(companyLimit: number | null) {
      component.info.set({
        ...component.info()!,
        company_limit: companyLimit,
        companies_count: 1,
        staff_used: 2,
        clients_used: 148,
        annual_discount_percent: 20,
        company_tiers: [
          { company_limit: 1, monthly_cents: 9900, annual_cents: 95040 },
          { company_limit: 3, monthly_cents: 24900, annual_cents: 239040 },
          { company_limit: null, monthly_cents: 59900, annual_cents: 575040 },
        ],
      });
      fixture.detectChanges();
    }

    it("shows every tier, not only the one the gym is on", () => {
      withTiers(1);

      expect(component.tiers().length).toBe(3);
      expect(fixture.nativeElement.querySelectorAll(".sub-tier").length).toBe(3);
    });

    it("marks exactly the tier the owner is on", () => {
      withTiers(3);

      expect(component.tiers().filter((t) => t.current).map((t) => t.limit)).toEqual([3]);
      expect(fixture.nativeElement.querySelectorAll(".sub-tier-ribbon").length).toBe(1);
    });

    // Both sides use null for unlimited, so it has to match rather than
    // falling through to "no tier is current".
    it("matches the unlimited tier for an owner with no limit", () => {
      withTiers(null);

      expect(component.tiers().filter((t) => t.current).map((t) => t.limit)).toEqual([null]);
    });

    it("switches the prices to the yearly ones", () => {
      withTiers(1);
      expect(component.tiers()[0].price).toBe(99);

      component.billingPeriod.set("yearly");

      expect(component.tiers()[0].price).toBe(950.4);
    });

    it("names the tier the usage block is about", () => {
      withTiers(3);

      expect(component.currentTierName()).toBe("subscription.tier_3");
    });

    it("counts the gyms against the limit, and drops the limit when there is none", () => {
      withTiers(3);
      expect(component.usage()[0].value).toBe("1 / 3");

      withTiers(null);
      expect(component.usage()[0].value).toBe("1");
    });

    it("draws nothing when the payload carries no tiers", () => {
      component.info.set({ ...component.info()!, company_tiers: [] });
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll(".sub-tier").length).toBe(0);
    });
  });
});
