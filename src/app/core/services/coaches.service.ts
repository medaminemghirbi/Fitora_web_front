import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../models/api-config";
import { Coach } from "../models/coach.model";

export type CoachPayload = Partial<
  Pick<Coach, "first_name" | "last_name" | "email" | "phone" | "bio" | "photo_url" | "birthdate" | "active">
>;

@Injectable({ providedIn: "root" })
export class CoachesService {
  constructor(private readonly http: HttpClient) {}

  list(): Observable<{ coaches: Coach[] }> {
    return this.http.get<{ coaches: Coach[] }>(`${API_BASE_URL}/coaches`);
  }

  get(id: string): Observable<{ coach: Coach }> {
    return this.http.get<{ coach: Coach }>(`${API_BASE_URL}/coaches/${id}`);
  }

  create(payload: CoachPayload): Observable<{ coach: Coach }> {
    return this.http.post<{ coach: Coach }>(`${API_BASE_URL}/coaches`, { coach: payload });
  }

  update(id: string, payload: CoachPayload): Observable<{ coach: Coach }> {
    return this.http.patch<{ coach: Coach }>(`${API_BASE_URL}/coaches/${id}`, { coach: payload });
  }

  deactivate(id: string): Observable<{ coach: Coach }> {
    return this.http.delete<{ coach: Coach }>(`${API_BASE_URL}/coaches/${id}`);
  }

  // Provisions (or resets) the coach's own mobile-app login — creates the
  // linked staff account on first call, just resets email/password after.
  setLogin(id: string, email: string, password: string): Observable<{ coach: Coach }> {
    return this.http.post<{ coach: Coach }>(`${API_BASE_URL}/coaches/${id}/login`, { email, password });
  }
}
