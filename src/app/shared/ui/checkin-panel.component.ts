import { Component, EventEmitter, Input, Output, computed, inject, signal } from "@angular/core";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { FormsModule } from "@angular/forms";
import { AttendanceBooking, AttendanceStatus } from "../../core/models/attendance.model";
import { AttendanceService } from "../../core/services/attendance.service";
import { ToastService } from "../../core/services/toast.service";
import { extractErrorMessage } from "../../core/services/error.util";
import { SkeletonComponent } from "./skeleton.component";
import { ErrorStateComponent } from "./error-state.component";
import { EmptyStateComponent } from "../components/empty-state.component";
import { HighlightPipe } from "../pipes/highlight.pipe";

/**
 * Marking a session's attendance, as a desk does it: the people expected,
 * a box to narrow them by name, and one tap each.
 *
 * It takes a session id rather than a loaded session so it can be dropped
 * anywhere a session is identified — today's schedule, the calendar's
 * session detail — without that caller having to fetch the roster first.
 */
@Component({
  selector: "app-checkin-panel",
  standalone: true,
  imports: [FormsModule, TranslateModule, SkeletonComponent, ErrorStateComponent, EmptyStateComponent, HighlightPipe],
  templateUrl: "./checkin-panel.component.html",
  styleUrl: "./checkin-panel.component.scss",
})
export class CheckinPanelComponent {
  private readonly attendance = inject(AttendanceService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(false);
  readonly error = signal(false);
  readonly bookings = signal<AttendanceBooking[]>([]);
  readonly search = signal("");
  /** The booking currently being written, so only its own row shows as busy. */
  readonly marking = signal<string | null>(null);

  private sessionIdValue = "";

  @Input({ required: true }) set sessionId(value: string) {
    if (!value || value === this.sessionIdValue) return;
    this.sessionIdValue = value;
    this.load();
  }

  /** Emitted after each successful mark, so a caller can refresh its counts. */
  @Output() readonly marked = new EventEmitter<void>();

  readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) return this.bookings();
    return this.bookings().filter((b) => b.client.full_name.toLowerCase().includes(term));
  });

  readonly presentCount = computed(() => this.bookings().filter((b) => b.attendance?.status === "present").length);

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.attendance.forSession(this.sessionIdValue).subscribe({
      next: (res) => {
        this.bookings.set(res.bookings);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  statusOf(booking: AttendanceBooking): AttendanceStatus | null {
    return booking.attendance?.status ?? null;
  }

  mark(booking: AttendanceBooking, status: AttendanceStatus): void {
    // Tapping the status a person already has undoes nothing — there is no
    // "unmark" — so it is simply ignored rather than sending a no-op write.
    if (this.statusOf(booking) === status || this.marking()) return;

    this.marking.set(booking.booking_id);
    this.attendance.mark(booking.booking_id, status).subscribe({
      next: (res) => {
        this.marking.set(null);
        this.bookings.update((list) => list.map((b) => (b.booking_id === booking.booking_id ? res.attendance : b)));
        this.marked.emit();
      },
      error: (err) => {
        this.marking.set(null);
        this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }
}
