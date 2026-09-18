import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../models/api-config";
import { MemberSession } from "../models/member.model";

/**
 * The member's own view of their gym's schedule
 * (Api::V1::Me::SessionsController). Read-only and always scoped
 * server-side to the gyms they belong to. Booking is
 * MemberBookingsService.create.
 */
@Injectable({ providedIn: "root" })
export class MemberSessionsService {
  constructor(private readonly http: HttpClient) {}

  list(date?: string, companyId?: string | null): Observable<{ sessions: MemberSession[] }> {
    const params: Record<string, string> = {};
    if (date) params["date"] = date;
    if (companyId) params["company_id"] = companyId;
    return this.http.get<{ sessions: MemberSession[] }>(`${API_BASE_URL}/me/sessions`, { params });
  }
}
