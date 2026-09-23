import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../models/api-config";
import { SupportTicket, SupportTicketKind } from "../models/support-ticket.model";

/** What a plan request carries on top of an ordinary ticket. */
export interface SupportTicketExtras {
  kind?: SupportTicketKind;
  /** Required by the backend when kind is "upgrade". */
  contact_phone?: string;
}

@Injectable({ providedIn: "root" })
export class SupportTicketsService {
  constructor(private readonly http: HttpClient) {}

  list(): Observable<{ support_tickets: SupportTicket[] }> {
    return this.http.get<{ support_tickets: SupportTicket[] }>(`${API_BASE_URL}/support_tickets`);
  }

  // multipart/form-data — files are actual uploads (images, videos, PDFs).
  create(
    subject: string,
    message: string,
    files: File[],
    extras: SupportTicketExtras = {}
  ): Observable<{ support_ticket: SupportTicket }> {
    const formData = new FormData();
    formData.append("subject", subject);
    formData.append("message", message);
    if (extras.kind) formData.append("kind", extras.kind);
    if (extras.contact_phone) formData.append("contact_phone", extras.contact_phone);
    files.forEach((file) => formData.append("attachments[]", file));
    return this.http.post<{ support_ticket: SupportTicket }>(`${API_BASE_URL}/support_tickets`, formData);
  }
}
