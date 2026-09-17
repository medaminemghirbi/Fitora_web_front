import { Component, OnInit, computed, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { Router } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { forkJoin } from "rxjs";
import { Booking } from "../../../core/models/booking.model";
import { Session } from "../../../core/models/session.model";
import { ConfirmService } from "../../../core/services/confirm.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import { MemberBookingsService } from "../../../core/services/member-bookings.service";
import { MemberSessionsService } from "../../../core/services/member-sessions.service";
import { ToastService } from "../../../core/services/toast.service";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";
import { StatusBadgeComponent } from "../../../shared/components/status-badge.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";
import { SkeletonComponent } from "../../../shared/ui/skeleton.component";

export type BookingsTab = "upcoming" | "past";

@Component({
  selector: "app-member-bookings",
  standalone: true,
  imports: [DatePipe, TranslateModule, EmptyStateComponent, StatusBadgeComponent, ErrorStateComponent, SkeletonComponent],
  providers: [DatePipe],
  templateUrl: "./member-bookings.component.html",
  styleUrl: "./member-bookings.component.scss",
})
export class MemberBookingsComponent implements OnInit {
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly tab = signal<BookingsTab>("upcoming");

  readonly upcomingBookings = signal<Booking[]>([]);
  readonly pastBookings = signal<Booking[]>([]);
  readonly bookableSessions = signal<Session[]>([]);

  readonly cancellingId = signal<string | null>(null);
  readonly rebookingId = signal<string | null>(null);

  readonly visibleBookings = computed(() => (this.tab() === "upcoming" ? this.upcomingBookings() : this.pastBookings()));

  constructor(
    private readonly router: Router,
    private readonly bookingsService: MemberBookingsService,
    private readonly sessionsService: MemberSessionsService,
    private readonly confirm: ConfirmService,
    private readonly toast: ToastService,
    private readonly translate: TranslateService,
    private readonly datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);

    forkJoin({
      upcoming: this.bookingsService.list("upcoming"),
      past: this.bookingsService.list("past"),
      sessions: this.sessionsService.list(),
    }).subscribe({
      next: ({ upcoming, past, sessions }) => {
        this.upcomingBookings.set(upcoming.bookings);
        this.pastBookings.set(past.bookings);
        this.bookableSessions.set(sessions.sessions);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  switchTab(tab: BookingsTab): void {
    this.tab.set(tab);
  }

  // The soonest not-yet-booked session for this activity, if the gym still
  // offers one — real data driving "book again", not a guess.
  nextSessionFor(activityName: string): Session | null {
    return this.bookableSessions().find((s) => s.activity_name === activityName && !s.already_booked) ?? null;
  }

  async cancel(booking: Booking): Promise<void> {
    const when = this.datePipe.transform(booking.session.starts_at, "EEE d MMM, HH:mm") ?? "";
    const confirmed = await this.confirm.ask({
      title: this.translate.instant("member.bookings.cancel_confirm_title"),
      body: this.translate.instant("member.bookings.cancel_confirm_body", { activity: booking.session.activity_name, when }),
      danger: true,
    });
    if (!confirmed) return;

    this.cancellingId.set(booking.id);
    this.bookingsService.cancel(booking.id).subscribe({
      next: () => {
        this.cancellingId.set(null);
        this.toast.success(this.translate.instant("member.bookings.cancelled_success"));
        this.load();
      },
      error: (err) => {
        this.cancellingId.set(null);
        this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }

  async bookAgain(booking: Booking): Promise<void> {
    const session = this.nextSessionFor(booking.session.activity_name);
    if (!session) {
      this.router.navigate(["/member/explore"], { queryParams: { activity: booking.session.activity_name } });
      return;
    }

    const when = this.datePipe.transform(session.starts_at, "EEE d MMM, HH:mm") ?? "";
    const confirmed = await this.confirm.ask({
      title: this.translate.instant("member.session.confirm_title"),
      body: this.translate.instant("member.session.confirm_body", { activity: session.activity_name, when }),
      confirmLabel: this.translate.instant("member.session.confirm_cta"),
    });
    if (!confirmed) return;

    this.rebookingId.set(booking.id);
    this.bookingsService.create(session.id).subscribe({
      next: (res) => {
        this.rebookingId.set(null);
        this.router.navigate(["/member/bookings", res.booking.id, "confirmed"], { state: { booking: res.booking } });
      },
      error: (err) => {
        this.rebookingId.set(null);
        this.toast.error(extractErrorMessage(err, this.translate.instant("member.session.booking_failed")));
      },
    });
  }
}
