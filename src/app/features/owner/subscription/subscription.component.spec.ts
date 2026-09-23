import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { SubscriptionInfo, SubscriptionService } from "../../../core/services/subscription.service";
import { SupportTicketsService } from "../../../core/services/support-tickets.service";
import { SupportTicket } from "../../../core/models/support-ticket.model";
import { ToastService } from "../../../core/services/toast.service";
import { SubscriptionComponent } from "./subscription.component";
import { AuthService } from "../../../core/auth/auth.service";

describe("SubscriptionComponent", () => {
  let fixture: ComponentFixture<SubscriptionComponent>;
  let component: SubscriptionComponent;
  let service: jasmine.SpyObj<SubscriptionService>;
  let tickets: jasmine.SpyObj<SupportTicketsService>;
  let toast: ToastService;

  const ticket: SupportTicket = {
    id: "t1",
    subject: "Demande",
    message: "…",
    status: "open",
    kind: "upgrade",
    contact_phone: "+216 22 123 456",
    created_at: "2026-01-01T00:00:00Z",
    attachments: [],
  };


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
          trial: false,
          trial_days_left: null,
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
        trial_days: 14,
        included_modules: [],
        company_limit: 1,
        companies_count: 1,
        company_limit_reached: true,
        company_tiers: [],
        payout: null,
        ...patch,
      } as SubscriptionInfo)
    );

    tickets = jasmine.createSpyObj<SupportTicketsService>("SupportTicketsService", ["create", "list"]);
    tickets.create.and.returnValue(of({ support_ticket: ticket }));

    TestBed.configureTestingModule({
      imports: [SubscriptionComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SubscriptionService, useValue: service },
        { provide: SupportTicketsService, useValue: tickets },
      ],
    });

    fixture = TestBed.createComponent(SubscriptionComponent);
    component = fixture.componentInstance;
    toast = TestBed.inject(ToastService);
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
      expect(fixture.nativeElement.querySelectorAll(".sub-cmp-tier").length).toBe(3);
    });

    it("marks exactly the tier the owner is on", () => {
      withTiers(3);

      expect(component.tiers().filter((t) => t.current).map((t) => t.limit)).toEqual([3]);
      expect(fixture.nativeElement.querySelectorAll(".sub-cmp-ribbon").length).toBe(1);
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

    // Every tier carries the whole of Fitora, so the modules are ticked
    // across the board — what differs is further down the table.
    it("ticks every module for every tier", () => {
      build({ included_modules: ["clients", "billing"] });
      withTiers(1);

      const included = component.compareGroups()[0];
      expect(included.labelKey).toBe("subscription.cmp_group_included");
      expect(included.rows.map((r) => r.key)).toEqual(["clients", "billing"]);
      expect(included.rows.every((r) => r.values.every((v) => v === "yes"))).toBeTrue();
    });

    it("leaves the modules group out when the payload carries none", () => {
      build({ included_modules: [] });
      withTiers(1);

      expect(component.compareGroups().map((g) => g.labelKey)).toEqual([
        "subscription.cmp_group_network",
        "subscription.cmp_group_advanced",
      ]);
    });

    // Sold on multi-gym features that are not all built yet; the cell has
    // to say so rather than ticking something the gym cannot use tonight.
    it("lines the multi-gym features up across the tiers, in column order", () => {
      withTiers(1);

      const network = component.compareGroups().find((g) => g.labelKey === "subscription.cmp_group_network")!;
      expect(network.rows.find((r) => r.key === "consolidated")!.values).toEqual(["no", "soon", "soon"]);
      expect(network.rows.find((r) => r.key === "per_gym_branding")!.values).toEqual(["no", "yes", "yes"]);

      const advanced = component.compareGroups().find((g) => g.labelKey === "subscription.cmp_group_advanced")!;
      expect(advanced.rows.find((r) => r.key === "priority_support")!.values).toEqual(["no", "no", "yes"]);
    });

    it("marks what is not shipped yet instead of ticking it", () => {
      withTiers(1);

      // Four multi-gym features across the two tiers that carry them, plus
      // the audit log and the API on the top tier alone.
      expect(fixture.nativeElement.querySelectorAll(".sub-cmp-soon").length).toBe(10);
      // Shipped: branding on the two multi-gym tiers, priority support on
      // the top one. This payload carries no modules of its own.
      expect(fixture.nativeElement.querySelectorAll(".sub-cmp-yes").length).toBe(3);
    });

    it("offers the other tiers, and never the one already active", () => {
      withTiers(1);

      const buttons = fixture.nativeElement.querySelectorAll(".sub-cmp-cta.is-request");
      expect(buttons.length).toBe(2);
      expect(fixture.nativeElement.querySelectorAll(".sub-cmp-cta.is-current").length).toBe(1);
    });

    it("sends the request as a support ticket, then reports it on the card", () => {
      withTiers(1);
      const success = spyOn(toast, "success");

      component.openRequest(component.tiers()[1]);
      component.requestPhone.set(" +216 22 123 456 ");
      component.requestNote.set("  On ouvre en novembre.  ");
      component.submitRequest();

      const [subject, message, files, extras] = tickets.create.calls.mostRecent().args;
      expect(subject).toContain("subscription.request_subject");
      expect(message).toContain("On ouvre en novembre.");
      expect(files).toEqual([]);
      expect(extras).toEqual({ kind: "upgrade", contact_phone: "+216 22 123 456" });
      expect(component.requestTier()).toBeNull();
      expect(component.requested(component.tiers()[1])).toBeTrue();
      expect(success).toHaveBeenCalled();

      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll(".sub-cmp-cta.is-sent").length).toBe(1);
      expect(fixture.nativeElement.querySelectorAll(".sub-cmp-cta.is-request").length).toBe(1);
    });

    it("sends the message alone when nothing was typed", () => {
      withTiers(1);

      component.openRequest(component.tiers()[1]);
      component.requestPhone.set("22123456");
      component.submitRequest();

      expect(tickets.create.calls.mostRecent().args[1]).toBe("subscription.request_body");
    });

    it("keeps the dialog open and says so when sending fails", () => {
      withTiers(1);
      tickets.create.and.returnValue(throwError(() => new Error("nope")));
      const error = spyOn(toast, "error");

      component.openRequest(component.tiers()[1]);
      component.requestPhone.set("22123456");
      component.submitRequest();

      expect(component.requesting()).toBeFalse();
      expect(component.requestTier()).not.toBeNull();
      expect(error).toHaveBeenCalled();
    });

    it("will not close or send twice while a request is in flight", () => {
      withTiers(1);
      component.openRequest(component.tiers()[1]);
      component.requesting.set(true);

      component.closeRequest();
      component.submitRequest();

      expect(component.requestTier()).not.toBeNull();
      expect(tickets.create).not.toHaveBeenCalled();
    });

    // Payment happens off-app: Fitora calls back to set the plan up.
    describe("the number to call back on", () => {
      it("will not send without one, and says so on the field", () => {
        withTiers(1);
        component.openRequest(component.tiers()[1]);
        component.requestPhone.set("");
        component.submitRequest();
        fixture.detectChanges();

        expect(tickets.create).not.toHaveBeenCalled();
        expect(component.requestTier()).not.toBeNull();
        const input = document.querySelector("#upgrade-phone") as HTMLInputElement;
        expect(input.classList).toContain("is-invalid");
        expect(document.querySelector(".invalid-feedback")!.textContent).toContain("subscription.request_phone_required");
      });

      it("will not send one that is not a number", () => {
        withTiers(1);
        component.openRequest(component.tiers()[1]);
        component.requestPhone.set("appelez-moi");
        component.submitRequest();
        fixture.detectChanges();

        expect(tickets.create).not.toHaveBeenCalled();
        expect(document.querySelector(".invalid-feedback")!.textContent).toContain("subscription.request_phone_invalid");
      });

      it("is not shown in red before a first attempt", () => {
        withTiers(1);
        component.openRequest(component.tiers()[1]);
        component.requestPhone.set("");
        fixture.detectChanges();

        expect((document.querySelector("#upgrade-phone") as HTMLInputElement).classList).not.toContain("is-invalid");
      });

      it("starts from the owner's own number", () => {
        (TestBed.inject(AuthService) as unknown as { currentUser: () => unknown }).currentUser = () => ({ phone: "+216 98 765 432" });
        withTiers(1);
        component.openRequest(component.tiers()[1]);

        expect(component.requestPhone()).toBe("+216 98 765 432");
      });
    });

    it("draws nothing when the payload carries no tiers", () => {
      component.info.set({ ...component.info()!, company_tiers: [] });
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll(".sub-cmp-tier").length).toBe(0);
    });

    // A new gym has paid nothing and chosen nothing: it is on the free
    // trial, not on Solo because Solo happens to be the default salle cap.
    describe("on the free trial", () => {
      function onTrial(daysLeft: number, active = true) {
        withTiers(1);
        component.info.set({
          ...component.info()!,
          subscription: {
            ...component.info()!.subscription!,
            active,
            lock_reason: active ? null : "unpaid",
            current_period_paid: daysLeft > 0,
            trial: true,
            trial_days_left: daysLeft,
          },
        });
        fixture.detectChanges();
      }

      it("leads the table with the trial, marked as current, and no tier with it", () => {
        onTrial(9);

        expect(component.tiers().map((t) => t.nameKey)).toEqual([
          "subscription.tier_trial",
          "subscription.tier_1",
          "subscription.tier_3",
          "subscription.tier_unlimited",
        ]);
        expect(component.tiers().filter((t) => t.current).map((t) => t.nameKey)).toEqual(["subscription.tier_trial"]);
        expect(fixture.nativeElement.querySelectorAll(".sub-cmp-ribbon").length).toBe(1);
        expect(component.currentTierName()).toBe("subscription.tier_trial");
      });

      it("is free, and says how long it lasts instead of a salle count", () => {
        onTrial(9);

        const first = fixture.nativeElement.querySelector(".sub-cmp-tier") as HTMLElement;
        expect(first.querySelector(".sub-cmp-price")!.textContent).toContain("subscription.trial_price");
        expect(first.querySelector(".sub-cmp-limit")!.textContent).toContain("subscription.trial_length");
      });

      it("carries the whole product: the top tier's column, not Solo's", () => {
        onTrial(9);

        const network = component.compareGroups().find((g) => g.labelKey === "subscription.cmp_group_network")!;
        const branding = network.rows.find((r) => r.key === "per_gym_branding")!;
        expect(branding.values).toEqual(["yes", "no", "yes", "yes"]);
      });

      it("offers every paid tier as a request", () => {
        onTrial(9);

        expect(fixture.nativeElement.querySelectorAll(".sub-cmp-cta.is-request").length).toBe(3);
      });

      it("drops the trial column once it has ended, and points at every tier", () => {
        onTrial(0, false);

        expect(component.tiers().length).toBe(3);
        expect(component.tiers().some((t) => t.current)).toBeFalse();
        expect(component.currentTierName()).toBe("subscription.tier_trial_over");
        expect(fixture.nativeElement.querySelector(".sub-state")!.getAttribute("data-state")).toBe("closed");
      });
    });
  });
});
