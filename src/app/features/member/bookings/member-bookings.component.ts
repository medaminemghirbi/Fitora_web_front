import { Component, inject, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { Booking } from "../../../core/models/booking.model";
import { MemberBookingsService, MemberBookingWhen } from "../../../core/services/member-bookings.service";
import { ConfirmService } from "../../../core/services/confirm.service";
import { ToastService } from "../../../core/services/toast.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";
import { SkeletonComponent } from "../../../shared/ui/skeleton.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";
import { StatusBadgeComponent } from "../../../shared/components/status-badge.component";

/** The member's own bookings — what is coming, and what already happened. */
@Component({
  selector: "app-member-bookings",
  standalone: true,
  imports: [
    DatePipe,
    TranslateModule,
    EmptyStateComponent,
    SkeletonComponent,
    ErrorStateComponent,
    StatusBadgeComponent,
  ],
  templateUrl: "./member-bookings.component.html",
  styleUrl: "./member-bookings.component.scss",
})
export class MemberBookingsComponent {
  private readonly service = inject(MemberBookingsService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly bookings = signal<Booking[]>([]);
  readonly when = signal<MemberBookingWhen>("upcoming");
  readonly cancelling = signal<string | null>(null);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.service.list(this.when()).subscribe({
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

  show(when: MemberBookingWhen): void {
    if (this.when() === when) return;
    this.when.set(when);
    this.load();
  }

  async cancel(booking: Booking): Promise<void> {
    if (this.cancelling()) return;

    const confirmed = await this.confirm.ask({
      title: this.translate.instant("member.cancel_confirm_title"),
      body: this.translate.instant("member.cancel_confirm_body", {
        activity: booking.session.activity_name,
      }),
      danger: true,
    });
    if (!confirmed) return;

    this.cancelling.set(booking.id);
    this.service.cancel(booking.id).subscribe({
      next: () => {
        this.cancelling.set(null);
        this.toast.success(this.translate.instant("member.cancelled"));
        this.load();
      },
      error: (err) => {
        this.cancelling.set(null);
        this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }
}
