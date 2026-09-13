export type NotificationKind = "contract_expiring" | "employee_birthday" | "system_update";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  /** Free-form payload the frontend composes the text from (name, date, title…). */
  data: Record<string, string | null>;
  /** In-app deep link to the related resource. */
  url: string;
  subject: { type: string; id: string } | null;
  read: boolean;
  created_at: string;
}

export interface NotificationPage {
  notifications: AppNotification[];
  meta: { page: number; per_page: number; total: number; total_pages: number };
  unread_count: number;
}
