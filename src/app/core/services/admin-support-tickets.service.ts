import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../models/api-config";
import { AdminSupportTicket, SupportTicketStatus } from "../models/support-ticket.model";
import { PageMeta } from "./sessions.service";

@Injectable({ providedIn: "root" })
export class AdminSupportTicketsService {
  constructor(private readonly http: HttpClient) {}

  list(status?: SupportTicketStatus): Observable<{ support_tickets: AdminSupportTicket[]; meta: PageMeta }> {
    const params: Record<string, string> = {};
    if (status) params["status"] = status;
    return this.http.get<{ support_tickets: AdminSupportTicket[]; meta: PageMeta }>(`${API_BASE_URL}/admin/support_tickets`, { params });
  }

  resolve(id: string): Observable<{ support_ticket: AdminSupportTicket }> {
    return this.http.patch<{ support_ticket: AdminSupportTicket }>(`${API_BASE_URL}/admin/support_tickets/${id}/resolve`, {});
  }
}
