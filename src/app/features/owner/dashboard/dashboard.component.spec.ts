import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { AuthService } from "../../../core/auth/auth.service";
import { ConfigurationService, SetupState } from "../../../core/configuration/configuration.service";
import { Company } from "../../../core/models/company.model";
import { AuditLogsService } from "../../../core/services/audit-logs.service";
import { DashboardResponse, DashboardService } from "../../../core/services/dashboard.service";
import { OnboardingService } from "../../../core/services/onboarding.service";
import { ReportsService } from "../../../core/services/reports.service";
import { RevenueService } from "../../../core/services/revenue.service";
import { ToastService } from "../../../core/services/toast.service";
import { DashboardComponent } from "./dashboard.component";

describe("DashboardComponent", () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;
  let dashboardService: jasmine.SpyObj<DashboardService>;
  let revenueService: jasmine.SpyObj<RevenueService>;
  let auditLogsService: jasmine.SpyObj<AuditLogsService>;
  let reportsService: jasmine.SpyObj<ReportsService>;
  let onboardingService: jasmine.SpyObj<OnboardingService>;
  let configStub: { setup: jasmine.Spy };
  let authStub: { currentUser: jasmine.Spy; hasPermission: jasmine.Spy };
  let toast: ToastService;

  const response: DashboardResponse = {
    company: { id: 1, name: "Fitora Fitness Sousse", currency: "TND" } as unknown as Company,
    stats: {
      total_clients: 12,
      active_contracts: 1,
      todays_bookings: 3,
      todays_attendance: 2,
      outstanding_payments: "65",
      todays_schedule: [
        { id: "1", starts_at: new Date().toISOString(), activity_name: "EMS", activity_emoji: "⚡", coach_name: "Amine", location_name: "Sousse", confirmed_count: 1, capacity: 1, status: "scheduled" },
      ],
      contracts_expiring: [],
      recent_payments: [],
      recent_clients: [],
    },
  };

  function build(setup: SetupState | null = null): void {
    TestBed.resetTestingModule();
    dashboardService = jasmine.createSpyObj("DashboardService", ["get"]);
    dashboardService.get.and.returnValue(of(response));
    revenueService = jasmine.createSpyObj("RevenueService", ["get"]);
    revenueService.get.and.returnValue(of({ today: 0, this_week: 0, this_month: 0, by_day: [{ date: "2026-01-01", total: 50 }] }));
    auditLogsService = jasmine.createSpyObj("AuditLogsService", ["list"]);
    auditLogsService.list.and.returnValue(of({ audit_logs: [], meta: { page: 1, per_page: 5, total: 0, total_pages: 0 } }));
    reportsService = jasmine.createSpyObj("ReportsService", ["exportCompany"]);
    onboardingService = jasmine.createSpyObj("OnboardingService", ["dismiss"]);
    configStub = { setup: jasmine.createSpy().and.returnValue(setup) };
    authStub = { currentUser: jasmine.createSpy().and.returnValue({ first_name: "Yassine", role: "owner" }), hasPermission: jasmine.createSpy().and.returnValue(true) };

    TestBed.configureTestingModule({
      imports: [DashboardComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DashboardService, useValue: dashboardService },
        { provide: RevenueService, useValue: revenueService },
        { provide: AuditLogsService, useValue: auditLogsService },
        { provide: ReportsService, useValue: reportsService },
        { provide: OnboardingService, useValue: onboardingService },
        { provide: AuthService, useValue: authStub },
        { provide: ConfigurationService, useValue: configStub },
      ],
    });

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();
  }

  beforeEach(() => build());

  it("fetches dashboard stats on init", () => {
    expect(dashboardService.get).toHaveBeenCalled();
    expect(component.data()?.stats.todays_bookings).toBe(3);
  });

  it("sets the error flag when loading dashboard stats fails", () => {
    dashboardService.get.and.returnValue(throwError(() => new Error("nope")));
    component.load();
    expect(component.error()).toBe(true);
  });

  it("stops audit-log loading even when it fails", () => {
    auditLogsService.list.and.returnValue(throwError(() => new Error("nope")));
    build();
    expect(component.auditLogsLoading()).toBe(false);
  });

  it("builds the revenue chart data from by_day", () => {
    expect(component.chartData().datasets?.[0].data).toEqual([50]);
    expect(component.revenue()?.today).toBe(0);
  });

  it("renders the KPI cards", () => {
    expect(fixture.nativeElement.querySelectorAll("app-kpi-card").length).toBe(5);
  });

  it("renders today's schedule rows", () => {
    expect(fixture.nativeElement.querySelectorAll("tbody tr").length).toBe(1);
  });

  it("showSetupCard is false with no setup state", () => {
    expect(component.showSetupCard).toBe(false);
  });

  it("showSetupCard is true for an incomplete, non-dismissed setup as owner", () => {
    build({ activity: false, contract_type: false, coach: false, work_contract: false, dismissed: false, complete: false });
    expect(component.showSetupCard).toBe(true);
  });

  it("showSetupCard is false once complete or dismissed", () => {
    build({ activity: true, contract_type: true, coach: true, work_contract: true, dismissed: false, complete: true });
    expect(component.showSetupCard).toBe(false);
  });

  it("showSetupCard is false for a non-owner even with incomplete setup", () => {
    build({ activity: false, contract_type: false, coach: false, work_contract: false, dismissed: false, complete: false });
    authStub.currentUser.and.returnValue({ first_name: "K", role: "staff" });
    expect(component.showSetupCard).toBe(false);
  });

  it("dismissSetup delegates to the onboarding service", () => {
    onboardingService.dismiss.and.returnValue(of({ setup: {} as SetupState }));
    component.dismissSetup();
    expect(onboardingService.dismiss).toHaveBeenCalled();
  });

  it("greetingKey depends on the time of day", () => {
    const clock = jasmine.clock();
    clock.install();
    try {
      clock.mockDate(new Date(2026, 0, 1, 8));
      expect(component.greetingKey()).toBe("dashboard.greeting_morning");
      clock.mockDate(new Date(2026, 0, 1, 14));
      expect(component.greetingKey()).toBe("dashboard.greeting_afternoon");
      clock.mockDate(new Date(2026, 0, 1, 20));
      expect(component.greetingKey()).toBe("dashboard.greeting_evening");
    } finally {
      clock.uninstall();
    }
  });

  describe("exportReport", () => {
    it("does nothing when the period is blank", () => {
      component.exportPeriodType.set("month");
      component.exportMonth.set("");
      component.exportReport();
      expect(reportsService.exportCompany).not.toHaveBeenCalled();
    });

    it("exports the monthly report", () => {
      reportsService.exportCompany.and.returnValue(of(new Blob(["x"])));
      component.exportPeriodType.set("month");
      component.exportMonth.set("2026-01");
      component.exportReport();
      expect(reportsService.exportCompany).toHaveBeenCalledWith("month", "2026-01");
      expect(component.exporting()).toBe(false);
    });

    it("exports the yearly report", () => {
      reportsService.exportCompany.and.returnValue(of(new Blob(["x"])));
      component.exportPeriodType.set("year");
      component.exportYear.set(2026);
      component.exportReport();
      expect(reportsService.exportCompany).toHaveBeenCalledWith("year", "2026");
    });

    it("shows an error toast on failure", () => {
      reportsService.exportCompany.and.returnValue(throwError(() => new Error("nope")));
      component.exportPeriodType.set("month");
      component.exportMonth.set("2026-01");
      component.exportReport();
      expect(component.exporting()).toBe(false);
      expect(toast.toasts()[0].kind).toBe("error");
    });
  });
});
