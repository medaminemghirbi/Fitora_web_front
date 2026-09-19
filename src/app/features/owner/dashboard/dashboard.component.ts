import { Component, computed, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { AuditLog } from "../../../core/models/audit-log.model";
import { AuditLogsService } from "../../../core/services/audit-logs.service";
import { AttentionRow, DashboardResponse, DashboardService, TodaysScheduleItem } from "../../../core/services/dashboard.service";
import { downloadBlob } from "../../../core/services/download.util";
import { ReportPeriodType, ReportsService } from "../../../core/services/reports.service";
import { ToastService } from "../../../core/services/toast.service";
import { AuthService } from "../../../core/auth/auth.service";
import { ConfigurationService } from "../../../core/configuration/configuration.service";
import { OnboardingService } from "../../../core/services/onboarding.service";
import { OnboardingStepsComponent } from "../../../shared/ui/onboarding-steps.component";
import { MoneyPipe } from "../../../shared/pipes/money.pipe";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";
import { SpinnerComponent } from "../../../shared/components/spinner.component";
import { StatusBadgeComponent } from "../../../shared/components/status-badge.component";
import { CheckinPanelComponent } from "../../../shared/ui/checkin-panel.component";
import { ModalComponent } from "../../../shared/components/modal.component";
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
    CheckinPanelComponent,
    ModalComponent,
    SkeletonComponent,
    ErrorStateComponent,
    OnboardingStepsComponent,
  ],
  templateUrl: "./dashboard.component.html",
  styleUrl: "./dashboard.component.scss",
})
export class DashboardComponent {
  /** Fixed at construction so the date in the header cannot drift mid-session. */
  readonly now = new Date();

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

  get onboardingState() {
    return this.onboarding.state();
  }

  get showSetupCard(): boolean {
    const s = this.onboardingState;
    return !!s && !s.complete && !s.dismissed && this.auth.currentUser()?.role === "owner";
  }

  dismissSetup(): void {
    this.onboarding.dismiss().subscribe();
  }

  // ---- checking people in ------------------------------------------------
  // The desk's most frequent action, and it used to mean finding the member
  // first. From here it is the session that is open, and the person is found
  // inside it by name.
  readonly checkinSessionId = signal<string | null>(null);

  /**
   * The session happening right now, if any. Computed in the reader's own
   * clock rather than the server's — which is why the payload carries both
   * ends of each session and no "current" flag.
   */
  readonly currentSession = computed(() => {
    const now = Date.now();
    return (
      this.data()?.stats.todays_schedule.find(
        (s) => s.status !== "cancelled" && new Date(s.starts_at).getTime() <= now && new Date(s.ends_at).getTime() > now
      ) ?? null
    );
  });

  openCheckin(sessionId: string): void {
    this.checkinSessionId.set(sessionId);
  }

  closeCheckin(): void {
    this.checkinSessionId.set(null);
    // Attendance changed, so today's counts did too.
    this.load();
  }

  /**
   * What an audit entry says, in words.
   *
   * The key is assembled from the action the backend sent
   * ("audit." + "payment.recorded"), which means a new action ships with no
   * translation and the log prints the key at the reader: twelve of the
   * twenty-five actions were doing exactly that. The labels are filled in
   * now, and this makes the next one degrade into something readable rather
   * than into "audit.subscription.invoice_issued".
   */
  auditLabel(action: string): string {
    const key = `audit.${action}`;
    const translated = this.translate.instant(key);
    if (translated !== key) return translated;

    // Last resort: the action itself, made pronounceable.
    return action.replace(/[._]/g, " ").replace(/^./, (c) => c.toUpperCase());
  }

  /** Fill ratio (0-100) for the schedule row's mini capacity bar. */
  fillPct(item: TodaysScheduleItem): number {
    return item.capacity > 0 ? Math.min(100, (item.confirmed_count / item.capacity) * 100) : 0;
  }

  /**
   * Already over. A finished session keeps its place in the day — it answers
   * "did anyone check in this morning?" — but it offers no check-in button
   * and reports what happened instead of how full it is.
   */
  hasEnded(item: TodaysScheduleItem): boolean {
    return new Date(item.ends_at).getTime() <= Date.now();
  }

  /**
   * The attention block: one line per kind of overdue work, each opening the
   * screen that resolves it already filtered.
   *
   * The backend sends every row, including the empty ones, so that "nothing
   * to do" is a fact this screen can state rather than an absence it has to
   * infer. Only the non-empty ones are rendered.
   */
  private readonly attentionTargets: Record<AttentionRow["key"], { route: string; query: Record<string, string>; icon: string; tone: string }> = {
    expiring: { route: "/owner/contracts", query: { status: "expiring" }, icon: "bi-hourglass-split", tone: "warning" },
    unpaid: { route: "/owner/contracts", query: { payment: "unpaid" }, icon: "bi-cash-coin", tone: "danger" },
    expired: { route: "/owner/contracts", query: { status: "expired" }, icon: "bi-x-octagon", tone: "danger" },
    sessions_without_coach: { route: "/owner/calendar", query: {}, icon: "bi-person-dash", tone: "warning" },
  };

  readonly attention = computed(() =>
    (this.data()?.stats.attention ?? [])
      .filter((row) => row.count > 0)
      .map((row) => ({ ...row, ...this.attentionTargets[row.key] }))
  );

  readonly allClear = computed(() => this.data() !== null && this.attention().length === 0);

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
