import { Component, OnInit, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { Router, RouterLink } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { Booking } from "../../../core/models/booking.model";
import { downloadBlob } from "../../../core/services/download.util";

function toIcsDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

@Component({
  selector: "app-member-booking-confirmation",
  standalone: true,
  imports: [RouterLink, DatePipe, TranslateModule],
  templateUrl: "./member-booking-confirmation.component.html",
  styleUrl: "./member-booking-confirmation.component.scss",
})
export class MemberBookingConfirmationComponent implements OnInit {
  readonly booking = signal<Booking | null>(null);

  constructor(private readonly router: Router) {}

  ngOnInit(): void {
    // No GET /me/bookings/:id exists — this screen only makes sense right
    // after MemberSessionDetailComponent#book() navigates here with the
    // fresh booking in router state. A direct/refreshed visit has nothing
    // to show, so send it to the bookings list instead.
    const booking = history.state?.booking as Booking | undefined;
    if (!booking) {
      this.router.navigate(["/member/bookings"]);
      return;
    }
    this.booking.set(booking);
  }

  addToCalendar(): void {
    const booking = this.booking();
    if (!booking) return;

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Fitora//Booking//EN",
      "BEGIN:VEVENT",
      `UID:${booking.id}@fitora`,
      `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
      `DTSTART:${toIcsDate(booking.session.starts_at)}`,
      `DTEND:${toIcsDate(booking.session.ends_at)}`,
      `SUMMARY:${booking.session.activity_name}`,
      `LOCATION:${booking.session.company_name}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    downloadBlob(new Blob([ics], { type: "text/calendar" }), `${booking.session.activity_name}.ics`);
  }
}
