import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../models/api-config";
import { Booking } from "../models/booking.model";

export type MemberBookingWhen = "upcoming" | "past";

// The client's own bookings (Api::V1::Me::BookingsController), from their
// own mobile-style login — the counterpart to BookingsService, which is
// staff/admin-facing.
@Injectable({ providedIn: "root" })
export class MemberBookingsService {
  constructor(private readonly http: HttpClient) {}

  list(when: MemberBookingWhen = "upcoming"): Observable<{ bookings: Booking[] }> {
    return this.http.get<{ bookings: Booking[] }>(`${API_BASE_URL}/me/bookings`, { params: { when } });
  }

  create(sessionId: string): Observable<{ booking: Booking }> {
    return this.http.post<{ booking: Booking }>(`${API_BASE_URL}/me/bookings`, { session_id: sessionId });
  }

  cancel(id: string): Observable<{ booking: Booking }> {
    return this.http.post<{ booking: Booking }>(`${API_BASE_URL}/me/bookings/${id}/cancel`, {});
  }
}
