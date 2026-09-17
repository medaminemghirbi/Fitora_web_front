import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../models/api-config";
import { Booking } from "../models/booking.model";
import { PageMeta } from "./sessions.service";

export interface BookingFilters {
  activity_id?: string;
  coach_id?: string;
  status?: string;
  date?: string;
  q?: string;
  page?: number;
}

/** `counts` feeds the filter rail, one entry per booking status plus "all". */
export interface BookingListResponse {
  bookings: Booking[];
  meta: PageMeta;
  counts: Record<string, number>;
}

@Injectable({ providedIn: "root" })
export class BookingsService {
  constructor(private readonly http: HttpClient) {}

  list(filters: BookingFilters = {}): Observable<BookingListResponse> {
    const params: Record<string, string> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") params[key] = String(value);
    });
    return this.http.get<BookingListResponse>(`${API_BASE_URL}/bookings`, { params });
  }

  create(clientId: string, sessionId: string): Observable<{ booking: Booking }> {
    return this.http.post<{ booking: Booking }>(`${API_BASE_URL}/bookings`, {
      client_id: clientId,
      session_id: sessionId,
    });
  }

  cancel(id: string): Observable<{ booking: Booking }> {
    return this.http.post<{ booking: Booking }>(`${API_BASE_URL}/bookings/${id}/cancel`, {});
  }

  // "Remind client" button — sends an SMS via the backend's TunisieSMS
  // integration (Bookings::SendReminder).
  remind(id: string): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${API_BASE_URL}/bookings/${id}/remind`, {});
  }
}
