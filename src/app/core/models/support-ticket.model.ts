export type SupportTicketStatus = "open" | "resolved";
/** `upgrade` is a plan request from the subscription page. */
export type SupportTicketKind = "general" | "upgrade";

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
  kind: SupportTicketKind;
  /** The number to call back on. Always set on a plan request. */
  contact_phone: string | null;
  created_at: string;
  attachments: SupportTicketAttachment[];
}

export interface AdminSupportTicket extends SupportTicket {
  company: { id: string; name: string };
  created_by: { id: string; full_name: string; email: string };
}
