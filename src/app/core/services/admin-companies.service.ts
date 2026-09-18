import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { AdminCompany, AdminCurrencyOption } from "../models/admin-company.model";
import { API_BASE_URL } from "../models/api-config";
import { User } from "../models/user.model";
import { PageMeta } from "./sessions.service";

export interface UpdateSubscriptionPayload {
  status?: string;
  expires_at?: string | null;
  billing_period?: string | null;
}

@Injectable({ providedIn: "root" })
export class AdminCompaniesService {
  constructor(private readonly http: HttpClient) {}

  list(page = 1, q?: string): Observable<{ companies: AdminCompany[]; meta: PageMeta }> {
    const params: Record<string, string> = { page: String(page) };
    if (q) params["q"] = q;
    return this.http.get<{ companies: AdminCompany[]; meta: PageMeta }>(`${API_BASE_URL}/admin/companies`, { params });
  }

  /**
   * The gyms asking to carry on past their trial, longest wait first.
   * An inbox rather than a directory: it empties as they are answered.
   */
  activationRequests(): Observable<{ companies: AdminCompany[] }> {
    return this.http.get<{ companies: AdminCompany[] }>(`${API_BASE_URL}/admin/companies/activation_requests`);
  }

  get(id: string): Observable<{
    company: AdminCompany;
    currency_options: AdminCurrencyOption[];
    locale_options: string[];
  }> {
    return this.http.get<{
      company: AdminCompany;
      currency_options: AdminCurrencyOption[];
      locale_options: string[];
    }>(`${API_BASE_URL}/admin/companies/${id}`);
  }

  updateSubscription(id: string, payload: UpdateSubscriptionPayload): Observable<{ company: AdminCompany }> {
    return this.http.patch<{ company: AdminCompany }>(`${API_BASE_URL}/admin/companies/${id}/subscription`, payload);
  }

  // Tenant-wide display settings — currency + app language — that a Fitora
  // admin manages on the company's behalf.
  updateSettings(id: string, settings: { currency?: string; locale?: string }): Observable<{ company: AdminCompany }> {
    return this.http.patch<{ company: AdminCompany }>(`${API_BASE_URL}/admin/companies/${id}/settings`, { company: settings });
  }

  // Records what the company currently owes Fitora off-app — informational,
  // no invoicing happens in-app.
  updateDebt(id: string, debtCents: number): Observable<{ company: AdminCompany }> {
    return this.http.patch<{ company: AdminCompany }>(`${API_BASE_URL}/admin/companies/${id}/debt`, { debt_cents: debtCents });
  }

  impersonate(id: string): Observable<{ token: string; user: User }> {
    return this.http.post<{ token: string; user: User }>(`${API_BASE_URL}/admin/companies/${id}/impersonate`, {});
  }
}
