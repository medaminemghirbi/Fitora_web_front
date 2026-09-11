import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../models/api-config";
import { Company } from "../models/company.model";

@Injectable({ providedIn: "root" })
export class CompanyService {
  constructor(private readonly http: HttpClient) {}

  get(): Observable<{ company: Company }> {
    return this.http.get<{ company: Company }>(`${API_BASE_URL}/company`);
  }

  create(payload: Partial<Company>): Observable<{ company: Company }> {
    return this.http.post<{ company: Company }>(`${API_BASE_URL}/company`, { company: payload });
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

  // The owner can only roll a fresh random key — setting a specific value
  // is admin-only (PATCH /api/v1/admin/companies/:id/mobile_key).
  regenerateMobileKey(): Observable<{ company: Company }> {
    return this.http.post<{ company: Company }>(`${API_BASE_URL}/company/regenerate_mobile_key`, {});
  }

  getMobileKeyQr(): Observable<Blob> {
    return this.http.get(`${API_BASE_URL}/company/mobile_key_qr`, { responseType: "blob" });
  }
}
