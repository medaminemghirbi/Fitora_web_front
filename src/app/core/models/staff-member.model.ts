import { StaffRole } from "./user.model";

export interface StaffMember {
  id: string;
  /** The kind of login (receptionist | coach). */
  role: StaffRole;
  /** Key of the assigned role — a built-in key or a custom-role slug. */
  role_key: string;
  role_name: string | null;
  permissions: string[];
  active: boolean;
  birthdate: string | null;
  user: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
  };
  coach_id: string | null;
  location_ids: string[];
}
