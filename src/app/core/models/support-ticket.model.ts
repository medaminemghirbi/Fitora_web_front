export type SupportTicketStatus = "open" | "resolved";

export interface SupportTicketAttachment {
  id: string;
  filename: string;
  content_type: string;
  byte_size: number;
  url: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  created_at: string;
  attachments: SupportTicketAttachment[];
}

export interface AdminSupportTicket extends SupportTicket {
  company: { id: string; name: string };
  created_by: { id: string; full_name: string; email: string };
}
