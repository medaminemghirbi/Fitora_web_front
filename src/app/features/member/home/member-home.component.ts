import { Component, OnInit, computed, signal } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { DatePipe } from "@angular/common";
import { forkJoin } from "rxjs";
import { Booking } from "../../../core/models/booking.model";
import { Session } from "../../../core/models/session.model";
import { AuthService } from "../../../core/auth/auth.service";
import { BrandingService } from "../../../core/services/branding.service";
import { MemberBookingsService } from "../../../core/services/member-bookings.service";
import { MemberSessionsService } from "../../../core/services/member-sessions.service";
import { isSameCalendarDay, spotsLeft } from "../../../core/services/member.util";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";
import { SpinnerComponent } from "../../../shared/components/spinner.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";
import { SkeletonComponent } from "../../../shared/ui/skeleton.component";

interface ActivityQuickPick {
  name: string;
  emoji: string | null;
}

@Component({
  selector: "app-member-home",
  standalone: true,
  imports: [RouterLink, TranslateModule, DatePipe, EmptyStateComponent, SpinnerComponent, ErrorStateComponent, SkeletonComponent],
  templateUrl: "./member-home.component.html",
  styleUrl: "./member-home.component.scss",
})
export class MemberHomeComponent implements OnInit {
  readonly loading = signal(true);
  readonly error = signal(false);

  readonly upcomingSessions = signal<Session[]>([]);
  readonly upcomingBookings = signal<Booking[]>([]);
  readonly pastBookings = signal<Booking[]>([]);

  readonly spotsLeft = spotsLeft;

  readonly firstName = computed(() => this.auth.currentClient()?.first_name ?? "");

  readonly nextBooking = computed<Booking | null>(() => this.upcomingBookings()[0] ?? null);

  readonly todaySessions = computed(() => this.upcomingSessions().filter((s) => isSameCalendarDay(s.starts_at)));

  readonly quickActivities = computed<ActivityQuickPick[]>(() => {
    const seen = new Set<string>();
    const picks: ActivityQuickPick[] = [];
    for (const session of this.upcomingSessions()) {
      if (seen.has(session.activity_name)) continue;
      seen.add(session.activity_name);
      picks.push({ name: session.activity_name, emoji: session.activity_emoji });
      if (picks.length >= 6) break;
    }
    return picks;
  });

  // Deterministic, rule-based "recommended for you": the activity the
  // client has completed most often, matched against its soonest bookable
  // upcoming (not-yet-booked) session. No AI, no invented signals — just
  // real booking history.
  readonly recommendedSession = computed<Session | null>(() => {
    const favoriteActivity = this.mostBookedActivity();
    if (!favoriteActivity) return null;
    return this.upcomingSessions().find((s) => s.activity_name === favoriteActivity && !s.already_booked) ?? null;
  });

  constructor(
    private readonly router: Router,
    private readonly sessionsService: MemberSessionsService,
    private readonly bookingsService: MemberBookingsService,
    readonly auth: AuthService,
    readonly branding: BrandingService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);

    forkJoin({
      sessions: this.sessionsService.list(),
      upcoming: this.bookingsService.list("upcoming"),
      past: this.bookingsService.list("past"),
    }).subscribe({
      next: ({ sessions, upcoming, past }) => {
        this.upcomingSessions.set(sessions.sessions);
        this.upcomingBookings.set(upcoming.bookings);
        this.pastBookings.set(past.bookings);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  openSession(session: Session): void {
    this.router.navigate(["/member/sessions", session.id], { state: { session } });
  }

  exploreActivity(activityName: string): void {
    this.router.navigate(["/member/explore"], { queryParams: { activity: activityName } });
  }

  private mostBookedActivity(): string | null {
    const counts = new Map<string, number>();
    for (const booking of this.pastBookings()) {
      if (booking.status !== "completed") continue;
      const name = booking.session.activity_name;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    let best: string | null = null;
    let bestCount = 0;
    for (const [name, count] of counts) {
      if (count > bestCount) {
        best = name;
        bestCount = count;
      }
    }
    return best;
  }
}
