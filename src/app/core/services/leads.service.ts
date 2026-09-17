import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../models/api-config";

export type LeadKind = "demo" | "quote";

export interface LeadPayload {
  kind: LeadKind;
  contact_name: string;
  gym_name: string;
  email: string;
  phone?: string;
  city?: string;
  locale?: string;
  message?: string;
}

/**
 * A gym asking to work with Fitora. There is no self-service gym signup any
 * more: this request is the front door, and Fitora opens the account after
 * the conversation. Write-only — a prospect can never read requests back.
 */
@Injectable({ providedIn: "root" })
export class LeadsService {
  constructor(private readonly http: HttpClient) {}

  submit(payload: LeadPayload): Observable<{ lead: { id: string; kind: LeadKind } }> {
    return this.http.post<{ lead: { id: string; kind: LeadKind } }>(`${API_BASE_URL}/leads`, { lead: payload });
  }
}
