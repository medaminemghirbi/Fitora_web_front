import { Component, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { AuditLog } from "../../../core/models/audit-log.model";
import { AuditLogsService } from "../../../core/services/audit-logs.service";
import { DashboardResponse, DashboardService, TodaysScheduleItem } from "../../../core/services/dashboard.service";
import { downloadBlob } from "../../../core/services/download.util";
import { ReportPeriodType, ReportsService } from "../../../core/services/reports.service";
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
    SetupChecklistComponent,
  ],
  templateUrl: "./dashboard.component.html",
  styleUrl: "./dashboard.component.scss",
})
export class DashboardComponent {
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly data = signal<DashboardResponse | null>(null);
  readonly auditLogs = signal<AuditLog[]>([]);
  readonly auditLogsLoading = signal(true);

  readonly exportPeriodType = signal<ReportPeriodType>("month");
  readonly exportMonth = signal(new Date().toISOString().slice(0, 7));
  readonly exportYear = signal(new Date().getFullYear());
  readonly exporting = signal(false);

  // The export form and the audit log are occasional tasks, not something an
  // owner needs open on every visit — collapsed behind the utility bar below
  // the fold, expanded on demand instead of always taking up a full card.
  readonly exportOpen = signal(false);
  readonly activityOpen = signal(false);

  constructor(
    private readonly dashboardService: DashboardService,
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

  /** Fill ratio (0-100) for the schedule row's mini capacity bar. */
  fillPct(item: TodaysScheduleItem): number {
    return item.capacity > 0 ? Math.min(100, (item.confirmed_count / item.capacity) * 100) : 0;
  }

  hasOutstanding(amount: string): boolean {
    return parseFloat(amount) > 0;
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
