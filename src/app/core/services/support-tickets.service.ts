import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../models/api-config";
import { SupportTicket } from "../models/support-ticket.model";

@Injectable({ providedIn: "root" })
export class SupportTicketsService {
  constructor(private readonly http: HttpClient) {}

  list(): Observable<{ support_tickets: SupportTicket[] }> {
    return this.http.get<{ support_tickets: SupportTicket[] }>(`${API_BASE_URL}/support_tickets`);
  }

  // multipart/form-data — files are actual uploads (images, videos, PDFs).
  create(subject: string, message: string, files: File[]): Observable<{ support_ticket: SupportTicket }> {
    const formData = new FormData();
    formData.append("subject", subject);
    formData.append("message", message);
    files.forEach((file) => formData.append("attachments[]", file));
    return this.http.post<{ support_ticket: SupportTicket }>(`${API_BASE_URL}/support_tickets`, formData);
  }
}
