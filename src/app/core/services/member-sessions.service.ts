import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../models/api-config";
import { Session } from "../models/session.model";

// The client's own view of their gym's bookable sessions
// (Api::V1::Me::SessionsController) — read-only, always scoped server-side
// to the logged-in client's own company. Booking itself is
// MemberBookingsService.create.
@Injectable({ providedIn: "root" })
export class MemberSessionsService {
  constructor(private readonly http: HttpClient) {}

  /** No gym = every gym the person belongs to, which is the default view. */
  list(date?: string, companyId?: string | null): Observable<{ sessions: Session[] }> {
    const params: Record<string, string> = {};
    if (date) params["date"] = date;
    if (companyId) params["company_id"] = companyId;
    return this.http.get<{ sessions: Session[] }>(`${API_BASE_URL}/me/sessions`, { params });
  }
}
