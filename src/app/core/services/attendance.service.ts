import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../models/api-config";
import { AttendanceBooking, AttendanceStatus } from "../models/attendance.model";
import { Session } from "../models/session.model";

@Injectable({ providedIn: "root" })
export class AttendanceService {
  constructor(private readonly http: HttpClient) {}

  forSession(sessionId: string): Observable<{ session: Session; bookings: AttendanceBooking[] }> {
    return this.http.get<{ session: Session; bookings: AttendanceBooking[] }>(`${API_BASE_URL}/attendance`, {
      params: { session_id: String(sessionId) },
    });
  }

  mark(bookingId: string, status: AttendanceStatus): Observable<{ attendance: AttendanceBooking }> {
    return this.http.post<{ attendance: AttendanceBooking }>(`${API_BASE_URL}/attendance`, { booking_id: bookingId, status });
  }
}
