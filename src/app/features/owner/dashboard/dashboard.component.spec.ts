import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { of } from "rxjs";
import { AuthService } from "../../../core/auth/auth.service";
import { ConfigurationService } from "../../../core/configuration/configuration.service";
import { Company } from "../../../core/models/company.model";
import { AuditLogsService } from "../../../core/services/audit-logs.service";
import { DashboardResponse, DashboardService } from "../../../core/services/dashboard.service";
import { RevenueService } from "../../../core/services/revenue.service";
import { DashboardComponent } from "./dashboard.component";

describe("DashboardComponent", () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let dashboardService: jasmine.SpyObj<DashboardService>;
  let revenueService: jasmine.SpyObj<RevenueService>;
  let auditLogsService: jasmine.SpyObj<AuditLogsService>;

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

  beforeEach(async () => {
    dashboardService = jasmine.createSpyObj("DashboardService", ["get"]);
    dashboardService.get.and.returnValue(of(response));
    revenueService = jasmine.createSpyObj("RevenueService", ["get"]);
    revenueService.get.and.returnValue(of({ today: 0, this_week: 0, this_month: 0, by_day: [] }));
    auditLogsService = jasmine.createSpyObj("AuditLogsService", ["list"]);
    auditLogsService.list.and.returnValue(of({ audit_logs: [], meta: { page: 1, per_page: 5, total: 0, total_pages: 0 } }));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DashboardService, useValue: dashboardService },
        { provide: RevenueService, useValue: revenueService },
        { provide: AuditLogsService, useValue: auditLogsService },
        { provide: AuthService, useValue: { currentUser: () => ({ first_name: "Yassine" }), hasPermission: () => true } },
        { provide: ConfigurationService, useValue: { setup: () => null } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
  });

  it("fetches dashboard stats on init", () => {
    expect(dashboardService.get).toHaveBeenCalled();
    expect(fixture.componentInstance.data()?.stats.todays_bookings).toBe(3);
  });

  it("renders the KPI cards", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll("app-kpi-card").length).toBe(5);
  });

  it("renders today's schedule rows", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll("tbody tr").length).toBe(1);
  });
});
