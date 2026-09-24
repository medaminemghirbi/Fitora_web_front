import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../models/api-config";

export type ReportPeriodType = "month" | "year";

@Injectable({ providedIn: "root" })
export class ReportsService {
  constructor(private readonly http: HttpClient) {}

  // Styled .xlsx export (Reports::CompanyWorkbook on the backend).
  exportCompany(periodType: ReportPeriodType, period: string): Observable<Blob> {
    return this.http.get(`${API_BASE_URL}/admin/reports/export`, {
      params: { period_type: periodType, period },
      responseType: "blob",
    });
  }
}
