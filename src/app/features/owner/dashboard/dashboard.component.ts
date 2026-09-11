import { Component, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { ChartConfiguration } from "chart.js";
import { NgChartsModule } from "ng2-charts";
import { AuditLog } from "../../../core/models/audit-log.model";
import { AuditLogsService } from "../../../core/services/audit-logs.service";
import { DashboardResponse, DashboardService } from "../../../core/services/dashboard.service";
import { downloadBlob } from "../../../core/services/download.util";
import { ReportPeriodType, ReportsService } from "../../../core/services/reports.service";
import { RevenueResponse, RevenueService } from "../../../core/services/revenue.service";
import { ToastService } from "../../../core/services/toast.service";
import { AuthService } from "../../../core/auth/auth.service";
import { ConfigurationService } from "../../../core/configuration/configuration.service";
import { OnboardingService } from "../../../core/services/onboarding.service";
import { SetupChecklistComponent } from "../../../shared/ui/setup-checklist.component";
import { MoneyPipe } from "../../../shared/pipes/money.pipe";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";
import { SpinnerComponent } from "../../../shared/components/spinner.component";
import { StatusBadgeComponent } from "../../../shared/components/status-badge.component";
import { PageHeaderComponent } from "../../../shared/ui/page-header.component";
import { KpiCardComponent } from "../../../shared/ui/kpi-card.component";
import { SkeletonComponent } from "../../../shared/ui/skeleton.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [
    TranslateModule,
    DatePipe,
    FormsModule,
    RouterLink,
    MoneyPipe,
    EmptyStateComponent,
    SpinnerComponent,
    StatusBadgeComponent,
    PageHeaderComponent,
    KpiCardComponent,
    SkeletonComponent,
    ErrorStateComponent,
    NgChartsModule,
    SetupChecklistComponent,
  ],
  templateUrl: "./dashboard.component.html",
  styleUrl: "./dashboard.component.scss",
})
export class DashboardComponent {
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly data = signal<DashboardResponse | null>(null);
  readonly revenue = signal<RevenueResponse | null>(null);
  readonly auditLogs = signal<AuditLog[]>([]);
  readonly auditLogsLoading = signal(true);

  readonly exportPeriodType = signal<ReportPeriodType>("month");
  readonly exportMonth = signal(new Date().toISOString().slice(0, 7));
  readonly exportYear = signal(new Date().getFullYear());
  readonly exporting = signal(false);

  readonly chartData = signal<ChartConfiguration<"line">["data"]>({ labels: [], datasets: [] });
  readonly chartOptions: ChartConfiguration<"line">["options"] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0f172a",
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
      },
    },
    elements: { point: { radius: 0, hoverRadius: 4 } },
    scales: {
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: "rgba(148, 163, 184, 0.18)" },
        ticks: { color: "#94a3b8", font: { size: 11 } },
      },
      x: {
        border: { display: false },
        grid: { display: false },
        ticks: { color: "#94a3b8", font: { size: 11 }, maxRotation: 0 },
      },
    },
  };

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly revenueService: RevenueService,
    private readonly reportsService: ReportsService,
    private readonly auditLogsService: AuditLogsService,
    private readonly toast: ToastService,
    private readonly translate: TranslateService,
    private readonly config: ConfigurationService,
    private readonly onboarding: OnboardingService,
    readonly auth: AuthService
  ) {
    this.load();

    this.auditLogsService.list(1, 5).subscribe({
      next: (res) => {
        this.auditLogs.set(res.audit_logs);
        this.auditLogsLoading.set(false);
      },
      error: () => this.auditLogsLoading.set(false),
    });

    this.revenueService.get().subscribe((res) => {
      this.revenue.set(res);
      this.chartData.set({
        labels: res.by_day.map((d) => new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })),
        datasets: [
          {
            data: res.by_day.map((d) => d.total),
            label: this.translate.instant("dashboard.revenue_overview"),
            borderColor: "#4a2a8f",
            backgroundColor: "rgba(74, 42, 143, 0.14)",
            fill: true,
            tension: 0.3,
          },
        ],
      });
    });
  }

  get setup() {
    return this.config.setup();
  }

  get showSetupCard(): boolean {
    const s = this.setup;
    return !!s && !s.complete && !s.dismissed && this.auth.currentUser()?.role === "owner";
  }

  dismissSetup(): void {
    this.onboarding.dismiss().subscribe();
  }

  greetingKey(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "dashboard.greeting_morning";
    if (hour < 18) return "dashboard.greeting_afternoon";
    return "dashboard.greeting_evening";
  }

  exportReport(): void {
    const periodType = this.exportPeriodType();
    const period = periodType === "month" ? this.exportMonth() : String(this.exportYear());
    if (!period) return;

    this.exporting.set(true);
    this.reportsService.exportCompany(periodType, period).subscribe({
      next: (blob) => {
        this.exporting.set(false);
        downloadBlob(blob, `fitora-rapport-${period}.xlsx`);
      },
      error: () => {
        this.exporting.set(false);
        this.toast.error(this.translate.instant("common.error_generic"));
      },
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.dashboardService.get().subscribe({
      next: (res) => {
        this.data.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
