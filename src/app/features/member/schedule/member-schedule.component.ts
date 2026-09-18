import { Component, computed, inject, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { MemberSession } from "../../../core/models/member.model";
import { MemberSessionsService } from "../../../core/services/member-sessions.service";
import { MemberBookingsService } from "../../../core/services/member-bookings.service";
import { MemberService } from "../../../core/services/member.service";
import { ToastService } from "../../../core/services/toast.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";
import { SkeletonComponent } from "../../../shared/ui/skeleton.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";

/** One day of the gym's schedule, with its sessions. */
interface ScheduleDay {
  date: string;
  sessions: MemberSession[];
}

/**
 * What the member's app opens on: their gym's upcoming sessions, grouped by
 * day, each bookable in one tap.
 *
 * There is no filtering and no search. A single gym's week is short enough
 * to read, and someone deciding whether to come on Thursday is not running a
 * query.
 */
@Component({
  selector: "app-member-schedule",
  standalone: true,
  imports: [DatePipe, TranslateModule, EmptyStateComponent, SkeletonComponent, ErrorStateComponent],
  templateUrl: "./member-schedule.component.html",
  styleUrl: "./member-schedule.component.scss",
})
export class MemberScheduleComponent {
  private readonly sessionsService = inject(MemberSessionsService);
  private readonly bookingsService = inject(MemberBookingsService);
  private readonly member = inject(MemberService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly sessions = signal<MemberSession[]>([]);
  /** The session being booked, so only its own button shows as busy. */
  readonly booking = signal<string | null>(null);

  /** Grouped by calendar day, in the order they happen. */
  readonly days = computed<ScheduleDay[]>(() => {
    const byDay = new Map<string, MemberSession[]>();
    for (const session of this.sessions()) {
      const key = session.starts_at.slice(0, 10);
      const day = byDay.get(key);
      if (day) day.push(session);
      else byDay.set(key, [session]);
    }
    return [...byDay.entries()].map(([date, sessions]) => ({ date, sessions }));
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.sessionsService.list(undefined, this.member.companyId()).subscribe({
      next: (res) => {
        this.sessions.set(res.sessions);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  /** True when there is no reason to offer the button at all. */
  unavailable(session: MemberSession): boolean {
    return session.already_booked || session.full;
  }

  book(session: MemberSession): void {
    if (this.booking() || this.unavailable(session)) return;

    this.booking.set(session.id);
    this.bookingsService.create(session.id).subscribe({
      next: () => {
        this.booking.set(null);
        this.toast.success(this.translate.instant("member.booked"));
        // The row has to show it, and one less place is left.
        this.sessions.update((list) =>
          list.map((s) =>
            s.id === session.id ? { ...s, already_booked: true, spots_left: Math.max(s.spots_left - 1, 0) } : s
          )
        );
      },
      error: (err) => {
        this.booking.set(null);
        this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }
}
