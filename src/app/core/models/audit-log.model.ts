export interface AuditLog {
  id: string;
  action: string;
  auditable_type: string;
  auditable_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
  user: { id: string; full_name: string } | null;
}
