import { Component, OnInit, computed, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { RouterLink } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import {
  ContractExpiringItem,
  DashboardService,
  RecentClientItem,
  TodaysScheduleItem,
} from "../../../core/services/dashboard.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";
import { SkeletonComponent } from "../../../shared/ui/skeleton.component";

/**
 * The front desk's home screen.
 *
 * It answers one question — what is happening right now — and it answers it
 * in the order the desk needs: the session on now, then the ones still to
 * come today, then the memberships about to lapse (the thing a receptionist
 * can actually fix while the person is standing there), then who is new.
 *
 * No totals, no revenue, no charts. Reading what the gym earns is a separate
 * capability and a different job.
 */
@Component({
  selector: "app-desk-dashboard",
  standalone: true,
  imports: [DatePipe, RouterLink, TranslateModule, EmptyStateComponent, ErrorStateComponent, SkeletonComponent],
  templateUrl: "./desk-dashboard.component.html",
  styleUrl: "./desk-dashboard.component.scss",
})
export class DeskDashboardComponent implements OnInit {
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly schedule = signal<TodaysScheduleItem[]>([]);
  readonly expiring = signal<ContractExpiringItem[]>([]);
  readonly recentClients = signal<RecentClientItem[]>([]);
  readonly checkedIn = signal(0);
  readonly bookedToday = signal(0);

  /** Refreshed on load so "now" does not drift across a long shift at the desk. */
  private readonly now = signal(Date.now());

  /** The session under way, if any — what the person at the counter is most likely here for. */
  readonly current = computed(() =>
    this.schedule().find((s) => this.hasStarted(s) && !this.hasEnded(s) && s.status === "scheduled") ?? null
  );

  /** Everything still to come today, soonest first. */
  readonly upcoming = computed(() =>
    this.schedule().filter((s) => !this.hasStarted(s) && s.status === "scheduled")
  );

  constructor(
    private readonly dashboard: DashboardService,
    private readonly translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.now.set(Date.now());

    this.dashboard.get().subscribe({
      next: ({ stats }) => {
        this.schedule.set(stats.todays_schedule);
        this.expiring.set(stats.contracts_expiring);
        this.recentClients.set(stats.recent_clients);
        this.checkedIn.set(stats.todays_attendance);
        this.bookedToday.set(stats.todays_bookings);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, this.translate.instant("common.error_generic")));
        this.loading.set(false);
      },
    });
  }

  /** How full a session is, for the "6 / 20" the desk reads at a glance. */
  spotsLeft(session: TodaysScheduleItem): number {
    return Math.max(session.capacity - session.confirmed_count, 0);
  }

  isFull(session: TodaysScheduleItem): boolean {
    return this.spotsLeft(session) === 0;
  }

  /** Days until a membership lapses — negative means it already has. */
  daysUntil(isoDate: string): number {
    const expires = new Date(isoDate).getTime();
    return Math.ceil((expires - this.now()) / 86_400_000);
  }

  private hasStarted(session: TodaysScheduleItem): boolean {
    return new Date(session.starts_at).getTime() <= this.now();
  }

  private hasEnded(session: TodaysScheduleItem): boolean {
    return new Date(session.ends_at).getTime() <= this.now();
  }
}
