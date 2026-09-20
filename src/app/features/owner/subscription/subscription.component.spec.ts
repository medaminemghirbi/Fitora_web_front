import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { Invoice } from "../../../core/models/subscription.model";
import { SubscriptionInfo, SubscriptionService } from "../../../core/services/subscription.service";
import { SubscriptionComponent } from "./subscription.component";

describe("SubscriptionComponent", () => {
  let fixture: ComponentFixture<SubscriptionComponent>;
  let component: SubscriptionComponent;
  let service: jasmine.SpyObj<SubscriptionService>;

  function invoice(patch: Partial<Invoice> = {}): Invoice {
    return {
      id: "inv1",
      number: "FIT-2026-0042",
      period_start: "2026-09-01",
      period_end: "2026-09-30",
      amount: 99,
      currency: "TND",
      billing_period: "monthly",
      issued_at: "2026-09-02T00:00:00Z",
      issued_by: "Fitora",
      notes: null,
      ...patch,
    } as Invoice;
  }

  function build(patch: Partial<SubscriptionInfo> = {}): void {
    TestBed.resetTestingModule();
    service = jasmine.createSpyObj<SubscriptionService>("SubscriptionService", ["get", "downloadInvoice"]);
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

  // The RIB comes from the host's environment, so "not configured" is the
  // normal state of a fresh install and must not render an empty bank card.
  describe("where the gym sends its money", () => {
    const account = {
      rib: "TN59 1000 6035 0123 4567 8901",
      bank_name: "BIAT",
      holder: "Fitora SARL",
      swift: null,
      reference: "FIT-GYMELITE",
    };

    it("shows no bank card until a RIB is configured", () => {
      build();
      expect(component.payout()).toBeNull();
      expect(fixture.nativeElement.querySelector(".payout")).toBeNull();
    });

    it("prints the account and the reference for the owner to transcribe", () => {
      build({ payout: account });
      const card: HTMLElement = fixture.nativeElement.querySelector(".payout");
      expect(card.textContent).toContain("TN59 1000 6035 0123 4567 8901");
      expect(card.textContent).toContain("BIAT");
      expect(card.textContent).toContain("Fitora SARL");
      expect(card.textContent).toContain("FIT-GYMELITE");
    });

    it("leaves out the rows the environment did not fill", () => {
      build({ payout: { ...account, bank_name: null, holder: null } });
      const card: HTMLElement = fixture.nativeElement.querySelector(".payout");
      expect(card.textContent).not.toContain("BIAT");
      expect(card.querySelectorAll(".payout-row").length).toBe(2);
    });

    it("copies the RIB and says so, then falls silent again", async () => {
      build({ payout: account });
      const writeText = jasmine.createSpy("writeText").and.returnValue(Promise.resolve());
      Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

      component.copy("rib", account.rib);
      await Promise.resolve();

      expect(writeText).toHaveBeenCalledWith(account.rib);
      expect(component.copied()).toBe("rib");
    });

    it("does not reach for the clipboard with nothing to put in it", () => {
      build({ payout: account });
      const writeText = jasmine.createSpy("writeText");
      Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

      component.copy("swift", null);

      expect(writeText).not.toHaveBeenCalled();
      expect(component.copied()).toBeNull();
    });
  });

  describe("the ledger of invoices", () => {
    it("paints a month green when an invoice covers its first day", () => {
      const year = new Date().getFullYear();
      build({ invoices: [invoice({ period_start: `${year}-01-01`, period_end: `${year}-01-31` })] });

      component.showYear(year);
      expect(component.ledger()[0].state).toBe("paid");
      expect(component.paidCount()).toBe(1);
    });

    it("paints a whole year from one yearly invoice", () => {
      const year = new Date().getFullYear();
      build({ invoices: [invoice({ period_start: `${year}-01-01`, period_end: `${year}-12-31`, billing_period: "yearly" })] });

      component.showYear(year);
      expect(component.paidCount()).toBe(12);
    });

    it("leaves a skipped month as a hole rather than filling it in", () => {
      const year = new Date().getFullYear();
      build({ invoices: [invoice({ period_start: `${year}-01-01`, period_end: `${year}-01-31` })] });

      component.showYear(year);
      expect(component.ledger()[1].invoice).toBeNull();
      expect(component.ledger()[1].state).not.toBe("paid");
    });
  });

  describe("downloading", () => {
    it("asks for the PDF and clears the busy flag", () => {
      service.downloadInvoice.and.returnValue(of(new Blob()));
      spyOn(URL, "createObjectURL").and.returnValue("blob:x");
      spyOn(URL, "revokeObjectURL");

      component.download(invoice());

      expect(service.downloadInvoice).toHaveBeenCalledWith("inv1");
      expect(component.downloading()).toBeNull();
    });

    it("does nothing for a month that has no invoice", () => {
      component.download(null);
      expect(service.downloadInvoice).not.toHaveBeenCalled();
    });

    it("clears the busy flag when the download fails", () => {
      service.downloadInvoice.and.returnValue(throwError(() => new Error("nope")));
      component.download(invoice());
      expect(component.downloading()).toBeNull();
    });
  });

  it("reports what is owed from the server, never from a typed-in field", () => {
    build({ arrears_cents: 19_800 });
    expect(component.arrears()).toBe(198);
  });

    it("lets a gym of several years open all of them", () => {
      build({
        invoices: [
          invoice({ id: "old", period_start: "2024-05-01", period_end: "2024-05-31" }),
          invoice({ id: "new", period_start: "2026-09-01", period_end: "2026-09-30" }),
        ],
      });

      expect(component.ledgerYears()).toContain(2024);
      expect(component.ledgerYears()).toContain(2026);
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
