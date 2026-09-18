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
});
