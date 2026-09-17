import { Component, OnInit, computed, signal } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { Booking } from "../../../core/models/booking.model";
import { MemberBookingsService } from "../../../core/services/member-bookings.service";
import { isoWeekKey } from "../../../core/services/member.util";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";
import { SkeletonComponent } from "../../../shared/ui/skeleton.component";

interface ActivityCount {
  name: string;
  emoji: string | null;
  count: number;
}

@Component({
  selector: "app-member-progress",
  standalone: true,
  imports: [TranslateModule, EmptyStateComponent, ErrorStateComponent, SkeletonComponent],
  templateUrl: "./member-progress.component.html",
  styleUrl: "./member-progress.component.scss",
})
export class MemberProgressComponent implements OnInit {
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly pastBookings = signal<Booking[]>([]);

  // Only a session actually marked "completed" (owner-side attendance)
  // counts as a real workout — a merely-past confirmed booking with no
  // attendance record isn't proof the client showed up.
  readonly completedBookings = computed(() => this.pastBookings().filter((b) => b.status === "completed"));

  readonly thisWeekCount = computed(() => {
    const currentWeek = isoWeekKey(new Date().toISOString());
    return this.completedBookings().filter((b) => isoWeekKey(b.session.starts_at) === currentWeek).length;
  });

  readonly byActivity = computed(() => this.groupByActivity(this.completedBookings()));

  readonly monthlyByActivity = computed(() => {
    const now = new Date();
    const thisMonth = this.completedBookings().filter((b) => {
      const d = new Date(b.session.starts_at);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    return this.groupByActivity(thisMonth);
  });

  readonly monthlyTotal = computed(() => this.monthlyByActivity().reduce((sum, a) => sum + a.count, 0));

  readonly streakWeeks = computed(() => {
    const weeksWithActivity = new Set(this.completedBookings().map((b) => isoWeekKey(b.session.starts_at)));
    if (weeksWithActivity.size === 0) return 0;

    let streak = 0;
    const cursor = new Date();
    // A streak isn't broken just because today hasn't happened yet — if
    // this week has nothing (so far), check from last week instead of
    // zeroing out immediately.
    if (!weeksWithActivity.has(isoWeekKey(cursor.toISOString()))) {
      cursor.setDate(cursor.getDate() - 7);
    }
    while (weeksWithActivity.has(isoWeekKey(cursor.toISOString()))) {
      streak++;
      cursor.setDate(cursor.getDate() - 7);
    }
    return streak;
  });

  constructor(private readonly bookingsService: MemberBookingsService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.bookingsService.list("past").subscribe({
      next: (res) => {
        this.pastBookings.set(res.bookings);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  private groupByActivity(bookings: Booking[]): ActivityCount[] {
    const counts = new Map<string, ActivityCount>();
    for (const booking of bookings) {
      const key = booking.session.activity_name;
      const existing = counts.get(key);
      if (existing) {
        existing.count++;
      } else {
        counts.set(key, { name: key, emoji: booking.session.activity_emoji, count: 1 });
      }
    }
    return Array.from(counts.values()).sort((a, b) => b.count - a.count);
  }
}
