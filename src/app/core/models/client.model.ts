import { Contract } from "./contract.model";

export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  active: boolean;
  /** Whether the gym has switched on this member's own app. */
  login_enabled: boolean;
  joined_at: string;
  /**
   * When they last actually turned up at this gym, or null if never. Sent on
   * the list as one grouped query for the whole page — the column that says
   * who is drifting away.
   */
  last_visit_at: string | null;
  current_contract: Contract | null;
}

export interface ClientDetail extends Client {
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  notes: string | null;
  outstanding_balance: string;
  attendance_rate: number | null;
}
