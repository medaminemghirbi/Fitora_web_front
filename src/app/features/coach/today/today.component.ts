import { Component, OnInit, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { AttendanceBooking, AttendanceStatus } from "../../../core/models/attendance.model";
import { Session } from "../../../core/models/session.model";
import { AttendanceService } from "../../../core/services/attendance.service";
import { SessionsService } from "../../../core/services/sessions.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import { ToastService } from "../../../core/services/toast.service";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";
import { SpinnerComponent } from "../../../shared/components/spinner.component";
import { StatusBadgeComponent } from "../../../shared/components/status-badge.component";

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

@Component({
  selector: "app-coach-today",
  standalone: true,
  imports: [DatePipe, TranslateModule, EmptyStateComponent, SpinnerComponent, StatusBadgeComponent],
  templateUrl: "./today.component.html",
  styleUrl: "./today.component.scss",
})
export class CoachTodayComponent implements OnInit {
  readonly loading = signal(true);
  readonly sessions = signal<Session[]>([]);
  readonly selectedDate = signal(toDateInputValue(new Date()));
  readonly selectedSession = signal<Session | null>(null);
  readonly bookings = signal<AttendanceBooking[]>([]);
  readonly bookingsLoading = signal(false);
  readonly markingBookingId = signal<string | null>(null);

  readonly statuses: AttendanceStatus[] = ["present", "absent", "late", "no_show"];

  constructor(
    private readonly sessionsService: SessionsService,
    private readonly attendanceService: AttendanceService,
    private readonly toast: ToastService,
    private readonly translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.selectedSession.set(null);
    this.bookings.set([]);
    this.sessionsService.list({ date: this.selectedDate() }).subscribe({
      next: (res) => {
        this.sessions.set(res.sessions);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  shiftDay(delta: number): void {
    const date = new Date(this.selectedDate());
    date.setDate(date.getDate() + delta);
    this.selectedDate.set(toDateInputValue(date));
    this.load();
  }

  goToday(): void {
    this.selectedDate.set(toDateInputValue(new Date()));
    this.load();
  }

  selectSession(session: Session): void {
    this.selectedSession.set(session);
    this.bookingsLoading.set(true);
    this.attendanceService.forSession(session.id).subscribe({
      next: (res) => {
        this.bookings.set(res.bookings);
        this.bookingsLoading.set(false);
      },
      error: (err) => {
        this.bookingsLoading.set(false);
        this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }

  mark(booking: AttendanceBooking, status: AttendanceStatus): void {
    this.markingBookingId.set(booking.booking_id);
    this.attendanceService.mark(booking.booking_id, status).subscribe({
      next: (res) => {
        this.markingBookingId.set(null);
        this.bookings.update((list) => list.map((b) => (b.booking_id === res.attendance.booking_id ? res.attendance : b)));
      },
      error: (err) => {
        this.markingBookingId.set(null);
        this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }
}
