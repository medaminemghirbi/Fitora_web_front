import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, convertToParamMap } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { Subject, of, throwError } from "rxjs";
import { AdminCompany } from "../../../core/models/admin-company.model";
import { AuthService } from "../../../core/auth/auth.service";
import { AdminCompaniesService } from "../../../core/services/admin-companies.service";
import { ToastService } from "../../../core/services/toast.service";
import { AdminCompanyDetailComponent } from "./company-detail.component";

describe("AdminCompanyDetailComponent", () => {
  let fixture: ComponentFixture<AdminCompanyDetailComponent>;
  let component: AdminCompanyDetailComponent;
  let service: jasmine.SpyObj<AdminCompaniesService>;
  let toast: ToastService;
  let authStub: { startImpersonation: jasmine.Spy };

  const company: AdminCompany = {
    awaiting_activation: false,
    usage: { clients: 0, staff: 0, activities: 0, sessions_last_30_days: 0, last_session_at: null },
    id: "c1",
    name: "Acme Gym",
    city: "Tunis",
    country: "TN",
    currency: "TND",
    currency_symbol: "DT",
    locale: "fr",
    active: true,
    created_at: "2026-01-01T00:00:00Z",
    owner: { id: "o1", full_name: "Sami Owner", email: "sami@x.test", phone: null },
    trial_locked: false,
    trial_days_remaining: null,
    monthly_subscription_cents: 15000,
    annual_subscription_cents: 162000,
    annual_discount_percent: 10,
    debt_cents: 5000,
    included_modules: [],
    subscription: {
      status: "active",
      expires_at: "2026-12-01T00:00:00Z",
      billing_period: "monthly",
      upgrade_requested_at: null,
      upgrade_requested_period: null,
    } as never,
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj<AdminCompaniesService>("AdminCompaniesService", [
      "get",
      "updateSubscription",
      "updateSettings",
      "updateDebt",
      "impersonate",
    ]);
    service.get.and.returnValue(of({ company, currency_options: [], locale_options: ["fr", "en"] }));
    authStub = { startImpersonation: jasmine.createSpy() };

    await TestBed.configureTestingModule({
      imports: [AdminCompanyDetailComponent, TranslateModule.forRoot()],
      providers: [
        { provide: AdminCompaniesService, useValue: service },
        { provide: AuthService, useValue: authStub },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: "c1" }) } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminCompanyDetailComponent);
    component = fixture.componentInstance;
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it("loads the company by route id and hydrates every form", () => {
    expect(service.get).toHaveBeenCalledWith("c1");
    expect(component.status()).toBe("active");
    expect(component.expiresAt()).toBe("2026-12-01");
    expect(component.billingPeriod()).toBe("monthly");
    expect(component.currency()).toBe("TND");
    expect(component.debtAmount()).toBe(50);
  });

  it("sets the error flag when loading fails", () => {
    service.get.and.returnValue(throwError(() => new Error("nope")));
    component.load();
    expect(component.error()).toBe(true);
  });

  it("formuleLabelKey reflects the company's actual billing period", () => {
    expect(component.formuleLabelKey()).toBe("subscription.plan_monthly");

    service.get.and.returnValue(of({ company: { ...company, subscription: { ...company.subscription, billing_period: "yearly" } as never }, currency_options: [], locale_options: [] }));
    component.load();
    expect(component.formuleLabelKey()).toBe("subscription.plan_yearly");

    service.get.and.returnValue(of({ company: { ...company, subscription: { ...company.subscription, billing_period: null } as never }, currency_options: [], locale_options: [] }));
    component.load();
    expect(component.formuleLabelKey()).toBe("admin.formule_trial");
  });

  it("subDirty/settingsDirty/debtDirty are false right after loading", () => {
    expect(component.subDirty()).toBe(false);
    expect(component.settingsDirty()).toBe(false);
    expect(component.debtDirty()).toBe(false);
  });

  it("subDirty flips when the status changes", () => {
    component.status.set("cancelled");
    expect(component.subDirty()).toBe(true);
  });

  it("settingsDirty flips when the currency changes", () => {
    component.currency.set("EUR");
    expect(component.settingsDirty()).toBe(true);
  });

  it("debtDirty flips when the debt amount changes", () => {
    component.debtAmount.set(100);
    expect(component.debtDirty()).toBe(true);
  });

  it("saveSubscription() saves, re-hydrates, and shows a success toast", () => {
    service.updateSubscription.and.returnValue(of({ company }));
    component.saveSubscription();
    expect(service.updateSubscription).toHaveBeenCalledWith("c1", { status: "active", expires_at: "2026-12-01", billing_period: "monthly" });
    expect(component.savingSub()).toBe(false);
    expect(toast.toasts()[0].kind).toBe("success");
  });

  it("saveSubscription() shows an error toast on failure", () => {
    service.updateSubscription.and.returnValue(throwError(() => new Error("nope")));
    component.saveSubscription();
    expect(component.savingSub()).toBe(false);
    expect(toast.toasts()[0].kind).toBe("error");
  });

  it("saveSettings() saves and re-hydrates", () => {
    service.updateSettings.and.returnValue(of({ company }));
    component.saveSettings();
    expect(service.updateSettings).toHaveBeenCalledWith("c1", { currency: "TND", locale: "fr" });
    expect(component.savingSettings()).toBe(false);
  });

  it("saveSettings() shows an error toast on failure", () => {
    service.updateSettings.and.returnValue(throwError(() => new Error("nope")));
    component.saveSettings();
    expect(toast.toasts()[0].kind).toBe("error");
  });

  it("saveDebt() converts units to cents and saves", () => {
    component.debtAmount.set(75.5);
    service.updateDebt.and.returnValue(of({ company }));
    component.saveDebt();
    expect(service.updateDebt).toHaveBeenCalledWith("c1", 7550);
    expect(component.savingDebt()).toBe(false);
  });

  it("saveDebt() shows an error toast on failure", () => {
    service.updateDebt.and.returnValue(throwError(() => new Error("nope")));
    component.saveDebt();
    expect(toast.toasts()[0].kind).toBe("error");
  });

  it("impersonate() starts the impersonation session on success", () => {
    service.impersonate.and.returnValue(of({ token: "t", user: {} as never }));
    component.impersonate();
    expect(authStub.startImpersonation).toHaveBeenCalledWith({ token: "t", user: {} }, "Acme Gym");
  });

  it("impersonate() resets the flag and shows an error toast on failure", () => {
    service.impersonate.and.returnValue(throwError(() => new Error("nope")));
    component.impersonate();
    expect(component.impersonating()).toBe(false);
    expect(toast.toasts()[0].kind).toBe("error");
  });

  it("hydrates fallbacks (active/'') for a company with no subscription yet", () => {
    service.get.and.returnValue(of({ company: { ...company, subscription: null }, currency_options: [], locale_options: [] }));
    component.load();
    expect(component.status()).toBe("active");
    expect(component.expiresAt()).toBe("");
    expect(component.billingPeriod()).toBe("");
  });

  it("subDirty compares against the fallback values for a company with no subscription", () => {
    service.get.and.returnValue(of({ company: { ...company, subscription: null }, currency_options: [], locale_options: [] }));
    component.load();
    expect(component.subDirty()).toBe(false);
    component.status.set("cancelled");
    expect(component.subDirty()).toBe(true);
  });

  it("defaults currency/locale options to [] when the backend omits them", () => {
    service.get.and.returnValue(
      of({ company, currency_options: undefined, locale_options: undefined } as unknown as { company: AdminCompany; currency_options: never[]; locale_options: never[] })
    );
    component.load();
    expect(component.currencyOptions()).toEqual([]);
    expect(component.localeOptions()).toEqual([]);
  });

  it("saveSubscription sends null instead of an empty string for expires_at/billing_period", () => {
    service.get.and.returnValue(of({ company: { ...company, subscription: null }, currency_options: [], locale_options: [] }));
    component.load();
    service.updateSubscription.and.returnValue(of({ company }));
    component.saveSubscription();
    expect(service.updateSubscription).toHaveBeenCalledWith("c1", { status: "active", expires_at: null, billing_period: null });
  });

  describe("before the company has loaded", () => {
    let fresh: ComponentFixture<AdminCompanyDetailComponent>;

    beforeEach(() => {
      // A fresh component whose very first `get()` never resolves — company()
      // stays null throughout, unlike reusing the outer fixture (already
      // hydrated by the shared beforeEach's synchronous `of(...)`).
      service.get.and.returnValue(new Subject());
      fresh = TestBed.createComponent(AdminCompanyDetailComponent);
      fresh.detectChanges();
    });

    it("subDirty/settingsDirty/debtDirty are false with no company loaded", () => {
      expect(fresh.componentInstance.subDirty()).toBe(false);
      expect(fresh.componentInstance.settingsDirty()).toBe(false);
      expect(fresh.componentInstance.debtDirty()).toBe(false);
    });

    it("impersonate() does nothing with no company loaded", () => {
      fresh.componentInstance.impersonate();
      expect(service.impersonate).not.toHaveBeenCalled();
    });
  });

  describe("what needs deciding", () => {
    function loadWith(patch: Record<string, unknown>): void {
      service.get.and.returnValue(
        of({ company: { ...company, ...patch } as never, currency_options: [], locale_options: [] })
      );
      component.load();
    }

    it("says nothing at all about a paying gym in good standing", () => {
      loadWith({ subscription: { ...company.subscription, billing_period: "monthly", upgrade_requested_at: null }, trial_locked: false, trial_days_remaining: null });
      expect(component.attention()).toBeNull();
    });

    it("leads with the gym that asked, over one merely running out", () => {
      loadWith({
        subscription: { ...company.subscription, upgrade_requested_at: "2026-09-14T00:00:00Z", upgrade_requested_period: "yearly" },
        trial_locked: true,
        trial_days_remaining: 0,
      });
      expect(component.attention()).toBe("asked");
      expect(component.askedPeriod()).toBe("yearly");
    });

    it("flags a gym already locked out", () => {
      loadWith({ subscription: { ...company.subscription, upgrade_requested_at: null }, trial_locked: true });
      expect(component.attention()).toBe("locked");
    });

    it("warns while a trial is running out, but not once a plan is set", () => {
      loadWith({ subscription: { ...company.subscription, billing_period: null, upgrade_requested_at: null }, trial_locked: false, trial_days_remaining: 3 });
      expect(component.attention()).toBe("ending");

      loadWith({ subscription: { ...company.subscription, billing_period: "monthly", upgrade_requested_at: null }, trial_locked: false, trial_days_remaining: 3 });
      expect(component.attention()).toBeNull();
    });

    it("counts the days a gym has been waiting", () => {
      const fourDaysAgo = new Date(Date.now() - 4 * 86_400_000).toISOString();
      loadWith({ subscription: { ...company.subscription, upgrade_requested_at: fourDaysAgo } });
      expect(component.waitingDays()).toBe(4);
    });
  });

  describe("activating in one action", () => {
    it("grants the period they asked for, with no end date — clearing it is what unlocks them", () => {
      service.updateSubscription.and.returnValue(of({ company }));
      service.get.and.returnValue(
        of({
          company: { ...company, subscription: { ...company.subscription, upgrade_requested_at: "2026-09-14T00:00:00Z", upgrade_requested_period: "yearly" } } as never,
          currency_options: [],
          locale_options: [],
        })
      );
      component.load();

      component.activate();

      expect(service.updateSubscription).toHaveBeenCalledWith("c1", {
        status: "active",
        expires_at: null,
        billing_period: "yearly",
      });
    });

    it("falls back to monthly when they expressed no preference", () => {
      service.updateSubscription.and.returnValue(of({ company }));
      service.get.and.returnValue(
        of({
          company: { ...company, subscription: { ...company.subscription, upgrade_requested_at: "2026-09-14T00:00:00Z", upgrade_requested_period: null } } as never,
          currency_options: [],
          locale_options: [],
        })
      );
      component.load();

      component.activate();

      expect(service.updateSubscription).toHaveBeenCalledWith(
        "c1",
        jasmine.objectContaining({ billing_period: "monthly" })
      );
    });

    it("stops spinning when the activation is refused", () => {
      service.updateSubscription.and.returnValue(throwError(() => new Error("nope")));
      component.activate();
      expect(component.savingSub()).toBe(false);
    });
  });
});

