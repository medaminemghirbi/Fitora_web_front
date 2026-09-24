import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../models/api-config";
import { Company } from "../models/company.model";
import { CompanySummary } from "../models/user.model";

@Injectable({ providedIn: "root" })
export class CompanyService {
  constructor(private readonly http: HttpClient) {}

  // Always the admin's currently ACTIVE company (see #switch below) —
  // everything else in the API follows whichever one this is.
  get(): Observable<{ company: Company }> {
    return this.http.get<{ company: Company }>(`${API_BASE_URL}/company`);
  }

  // A second (or third…) company under the same admin login — capped by
  // their plan (see User#companies / #company_limit_reached in the
  // "companies" field of the current user). Becomes the active company.
  create(payload: Partial<Company>): Observable<{ company: Company }> {
    return this.http.post<{ company: Company }>(`${API_BASE_URL}/companies`, { company: payload });
  }

  // Every company this admin runs — the navbar switcher's data source.
  list(): Observable<{ companies: CompanySummary[] }> {
    return this.http.get<{ companies: CompanySummary[] }>(`${API_BASE_URL}/companies`);
  }

  // Moves the admin's session onto another of their OWN companies.
  switchTo(companyId: string): Observable<{ company: Company }> {
    return this.http.post<{ company: Company }>(`${API_BASE_URL}/companies/${companyId}/switch`, {});
  }

  update(payload: Partial<Company>): Observable<{ company: Company }> {
    return this.http.patch<{ company: Company }>(`${API_BASE_URL}/company`, {
      company: payload,
    });
  }

  // Separate from update() because it may carry a logo File and so needs
  // multipart/form-data — the plain company-profile form above never
  // uploads a file and stays on the simpler JSON path.
  updateBranding(payload: { slug?: string | null; primary_color?: string | null; logo?: File | null }): Observable<{ company: Company }> {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      formData.append(`company[${key}]`, value as string | File);
    });
    return this.http.patch<{ company: Company }>(`${API_BASE_URL}/company`, formData);
  }

  /** Puts the gym in (or out of) the public directory. */
  publish(listed: boolean): Observable<{ company: Company }> {
    return this.http.post<{ company: Company }>(`${API_BASE_URL}/company/publish`, { listed });
  }
}
