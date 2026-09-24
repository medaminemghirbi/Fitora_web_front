export type UserRole = "admin" | "staff" | "superadmin";
// The *kind* of staff login (not its permissions — those come from the
// assigned role, which may be a custom one).
/** The built-in staff roles below the superadmin. A gym may add custom ones. */
export type StaffRole = "moderator" | "coach";

// GET /api/v1/me/permissions — the resolved capability list for the current
// login, plus the role it was resolved from. The app renders navigation and
// guards page access from `permissions` rather than a hard-coded map.
export interface MePermissions {
  role: { key: string; name: string } | null;
  permissions: string[];
}

// One of an admin's companies, for the navbar switcher — the lightweight
// shape (CompanySummarySerializer on the backend), not the full company
// settings payload.
export interface CompanySummary {
  id: string;
  name: string;
  logo_url: string | null;
  currency: string;
  active: boolean;
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
  /**
   * Seconds before the confirmation link may be sent again (0 = now).
   * Optional so fixtures elsewhere need not carry it.
   */
  email_verification_resend_in?: number;
  company_id: string | null;
  // The key of the role this login is assigned to: "moderator", "coach",
  // or a custom role's own slug. For "does this person coach?", read
  // is_coach — an admin can put a coach on a custom role.
  staff_role: StaffRole | string | null;
  // Whether this login has a coach record of its own. The coach shell and
  // the post-login redirect key off this, not off the role's name.
  is_coach: boolean;
  // Present (non-null) for an admin — every company they run, one flagged
  // active; null for staff/superadmin, never []. Optional (not just nullable)
  // so existing test fixtures across the app don't all need updating —
  // the navbar switcher already treats "missing" the same as "null".
  companies?: CompanySummary[] | null;
}
