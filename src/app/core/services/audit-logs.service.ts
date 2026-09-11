import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../models/api-config";
import { AuditLog } from "../models/audit-log.model";
import { PageMeta } from "./sessions.service";

@Injectable({ providedIn: "root" })
export class AuditLogsService {
  constructor(private readonly http: HttpClient) {}

  list(page = 1, perPage = 5): Observable<{ audit_logs: AuditLog[]; meta: PageMeta }> {
    return this.http.get<{ audit_logs: AuditLog[]; meta: PageMeta }>(`${API_BASE_URL}/audit_logs`, {
      params: { page: String(page), per_page: String(perPage) },
    });
  }
}
