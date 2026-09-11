export type UserRole = "owner" | "staff" | "admin";
// The *kind* of staff login (not its permissions — those come from the
// assigned role, which may be a custom one).
export type StaffRole = "receptionist" | "coach";

// GET /api/v1/me/permissions — the resolved capability list for the current
// login, plus the role it was resolved from. The app renders navigation and
// guards page access from `permissions` rather than a hard-coded map.
export interface MePermissions {
  role: { key: string; name: string } | null;
  permissions: string[];
}

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  locale: string;
  email_verified: boolean;
  company_id: string | null;
  staff_role: StaffRole | null;
}
