import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../models/api-config";

export type LeadKind = "demo" | "quote";
export type LeadStatus = "new_request" | "contacted" | "converted" | "dropped";

/** A request as Fitora's own admin reads it. */
export interface Lead {
  id: string;
  kind: LeadKind;
  status: LeadStatus;
  contact_name: string;
  gym_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  locale: string | null;
  message: string | null;
  internal_notes: string | null;
  handled_at: string | null;
  handled_by: string | null;
  company_id: string | null;
  created_at: string;
}

/**
 * What opening an account hands back. The password is shown once and never
 * stored anywhere readable — whoever converts the lead has to pass it on.
 */
export interface LeadConversion {
  lead: Lead;
  company: { id: string; name: string };
  owner: { id: string; email: string };
  temporary_password: string;
}

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

/**
 * The same requests from Fitora's side: the inbox, and the one action that
 * turns an answered request into a working account.
 */
@Injectable({ providedIn: "root" })
export class AdminLeadsService {
  constructor(private readonly http: HttpClient) {}

  list(status?: LeadStatus | ""): Observable<{ leads: Lead[]; counts: Record<string, number> }> {
    const params: Record<string, string> = {};
    if (status) params["status"] = status;
    return this.http.get<{ leads: Lead[]; counts: Record<string, number> }>(`${API_BASE_URL}/admin/leads`, { params });
  }

  update(id: string, payload: { status?: LeadStatus; internal_notes?: string }): Observable<{ lead: Lead }> {
    return this.http.patch<{ lead: Lead }>(`${API_BASE_URL}/admin/leads/${id}`, { lead: payload });
  }

  /** Opens the gym's account and starts its 14 days. */
  convert(id: string): Observable<LeadConversion> {
    return this.http.post<LeadConversion>(`${API_BASE_URL}/admin/leads/${id}/convert`, {});
  }
}
