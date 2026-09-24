import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../models/api-config";
import { SuperadminSupportTicket, SupportTicketStatus } from "../models/support-ticket.model";
import { PageMeta } from "./sessions.service";

@Injectable({ providedIn: "root" })
export class SuperadminSupportTicketsService {
  constructor(private readonly http: HttpClient) {}

  list(status?: SupportTicketStatus): Observable<{ support_tickets: SuperadminSupportTicket[]; meta: PageMeta }> {
    const params: Record<string, string> = {};
    if (status) params["status"] = status;
    return this.http.get<{ support_tickets: SuperadminSupportTicket[]; meta: PageMeta }>(`${API_BASE_URL}/superadmin/support_tickets`, { params });
  }

  resolve(id: string): Observable<{ support_ticket: SuperadminSupportTicket }> {
    return this.http.patch<{ support_ticket: SuperadminSupportTicket }>(`${API_BASE_URL}/superadmin/support_tickets/${id}/resolve`, {});
  }
}
