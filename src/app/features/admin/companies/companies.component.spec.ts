import { ComponentFixture, TestBed, fakeAsync, tick } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { AdminCompany } from "../../../core/models/admin-company.model";
import { AdminCompaniesService } from "../../../core/services/admin-companies.service";
import { AdminCompaniesComponent } from "./companies.component";

describe("AdminCompaniesComponent", () => {
  let fixture: ComponentFixture<AdminCompaniesComponent>;
  let component: AdminCompaniesComponent;
  let service: jasmine.SpyObj<AdminCompaniesService>;

  const meta = { page: 1, per_page: 20, total: 1, total_pages: 1 };
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
    subscription: null,
    trial_locked: false,
    trial_days_remaining: null,
    monthly_subscription_cents: 15000,
    annual_subscription_cents: 162000,
    annual_discount_percent: 10,
    debt_cents: 0,
    included_modules: [],
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj<AdminCompaniesService>("AdminCompaniesService", ["list"]);
    service.list.and.returnValue(of({ companies: [company], meta, awaiting_count: 0 }));

    await TestBed.configureTestingModule({
      imports: [AdminCompaniesComponent, TranslateModule.forRoot()],
      providers: [provideRouter([]), { provide: AdminCompaniesService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminCompaniesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("loads the first page on init", () => {
    expect(service.list).toHaveBeenCalledWith(1, undefined, false);
    expect(component.companies().length).toBe(1);
    expect(component.loading()).toBe(false);
  });

  it("sets the error flag when loading fails", () => {
    service.list.and.returnValue(throwError(() => new Error("nope")));
    component.load();
    expect(component.error()).toBe(true);
    expect(component.loading()).toBe(false);
  });

  it("onSearchChange debounces, resets to page 1, and passes the term", fakeAsync(() => {
    component.page.set(3);
    component.onSearchChange("acme");
    expect(service.list).not.toHaveBeenCalledWith(1, "acme", false);

    tick(1000);

    expect(component.page()).toBe(1);
    expect(service.list).toHaveBeenCalledWith(1, "acme", false);
  }));

  it("onSearchChange restarts the debounce timer on rapid typing", fakeAsync(() => {
    component.onSearchChange("ac");
    tick(500);
    component.onSearchChange("acme"); // clears the still-pending first timer
    tick(500);
    expect(service.list).not.toHaveBeenCalledWith(1, "acme", false);
    tick(500);
    expect(service.list).toHaveBeenCalledWith(1, "acme", false);
  }));

  it("onPageChange loads the requested page", () => {
    component.onPageChange(2);
    expect(component.page()).toBe(2);
    expect(service.list).toHaveBeenCalledWith(2, undefined, false);
  });

  // Removing the separate inbox must not lose the signal: a gym that asked
  // to carry on has to be visible without opening its page.
  describe("gyms waiting on an answer", () => {
    it("reports how many are waiting, even while the list shows everyone", () => {
      service.list.and.returnValue(of({ companies: [company], meta, awaiting_count: 3 }));
      component.load();
      expect(component.awaitingCount()).toBe(3);
      expect(component.onlyAwaiting()).toBe(false);
    });

    it("narrows to them on request, and back again", () => {
      component.toggleAwaiting();
      expect(component.onlyAwaiting()).toBe(true);
      expect(service.list).toHaveBeenCalledWith(1, undefined, true);

      component.toggleAwaiting();
      expect(component.onlyAwaiting()).toBe(false);
      expect(service.list).toHaveBeenCalledWith(1, undefined, false);
    });

    it("returns to the first page when narrowing, so nothing hides on page 2", () => {
      component.page.set(4);
      component.toggleAwaiting();
      expect(component.page()).toBe(1);
    });
  });
});

