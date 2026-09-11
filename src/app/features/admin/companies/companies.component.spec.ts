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
    id: "c1",
    name: "Acme Gym",
    city: "Tunis",
    country: "TN",
    currency: "TND",
    currency_symbol: "DT",
    locale: "fr",
    active: true,
    mobile_auth_key: "key",
    created_at: "2026-01-01T00:00:00Z",
    locations_count: 1,
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
    service.list.and.returnValue(of({ companies: [company], meta }));

    await TestBed.configureTestingModule({
      imports: [AdminCompaniesComponent, TranslateModule.forRoot()],
      providers: [provideRouter([]), { provide: AdminCompaniesService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminCompaniesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("loads the first page on init", () => {
    expect(service.list).toHaveBeenCalledWith(1, undefined);
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
    expect(service.list).not.toHaveBeenCalledWith(1, "acme");

    tick(1000);

    expect(component.page()).toBe(1);
    expect(service.list).toHaveBeenCalledWith(1, "acme");
  }));

  it("onSearchChange restarts the debounce timer on rapid typing", fakeAsync(() => {
    component.onSearchChange("ac");
    tick(500);
    component.onSearchChange("acme"); // clears the still-pending first timer
    tick(500);
    expect(service.list).not.toHaveBeenCalledWith(1, "acme");
    tick(500);
    expect(service.list).toHaveBeenCalledWith(1, "acme");
  }));

  it("onPageChange loads the requested page", () => {
    component.onPageChange(2);
    expect(component.page()).toBe(2);
    expect(service.list).toHaveBeenCalledWith(2, undefined);
  });
});
