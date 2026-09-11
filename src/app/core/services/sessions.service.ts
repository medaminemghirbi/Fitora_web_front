import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../models/api-config";
import { Session } from "../models/session.model";

export interface SessionPayload {
  activity_id: string;
  /** Set only for an individual session — books this member into the new session. */
  client_id?: string;
  coach_id?: string | null;
  starts_at: string;
  ends_at: string;
  capacity?: number;
  price?: number;
}

export interface SessionFilters {
  activity_id?: string;
  coach_id?: string;
  status?: string;
  date?: string;
}

export interface SessionRange {
  from: string;
  to: string;
  activity_id?: string;
  coach_id?: string;
  status?: string;
}

@Injectable({ providedIn: "root" })
export class SessionsService {
  constructor(private readonly http: HttpClient) {}

  list(filters: SessionFilters = {}): Observable<{ sessions: Session[]; meta: PageMeta }> {
    const params: Record<string, string> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") params[key] = String(value);
    });
    return this.http.get<{ sessions: Session[]; meta: PageMeta }>(`${API_BASE_URL}/sessions`, { params });
  }

  // Range query for the calendar — returns every session in [from, to], not
  // a paginated slice.
  range(range: SessionRange): Observable<{ sessions: Session[] }> {
    const params: Record<string, string> = {};
    Object.entries(range).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") params[key] = String(value);
    });
    return this.http.get<{ sessions: Session[] }>(`${API_BASE_URL}/sessions`, { params });
  }

  create(payload: SessionPayload): Observable<{ session: Session }> {
    return this.http.post<{ session: Session }>(`${API_BASE_URL}/sessions`, { session: payload });
  }

  update(id: string, payload: Partial<SessionPayload>): Observable<{ session: Session }> {
    return this.http.patch<{ session: Session }>(`${API_BASE_URL}/sessions/${id}`, { session: payload });
  }

  cancel(id: string): Observable<{ session: Session }> {
    return this.http.post<{ session: Session }>(`${API_BASE_URL}/sessions/${id}/cancel`, {});
  }
}

export interface PageMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}
