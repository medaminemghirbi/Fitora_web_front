import { ContractType } from "./contract-type.model";

export type ContractStatus = "pending" | "active" | "expired" | "cancelled";
export type PaymentStatus = "unpaid" | "paid";

export interface ContractPeriodSummary {
  id: string;
  starts_at: string | null;
  expires_at: string | null;
  final_price: string;
  payment_status: PaymentStatus;
}

export interface Contract {
  id: string;
  current_period_id: string | null;
  status: ContractStatus;
  starts_at: string | null;
  expires_at: string | null;
  remaining_bookings: number | null;
  auto_renew: boolean;
  discount: string;
  // The price this period was SOLD at, frozen at subscription time.
  base_price: string | null;
  final_price: string;
  payment_status: PaymentStatus;
  /**
   * What's still owed on this contract — the current term plus any renewal
   * queued behind it, since a renewal is sold unpaid (no part payments: each
   * period is owed in full or not at all).
   */
  amount_due: string;
  /** The period "Encaisser" settles: the oldest one still owed, or null. */
  payable_period_id: string | null;
  plan: ContractType;
  /**
   * null for an all-access contract, which covers every activity its plan
   * covers rather than naming one. Read `all_access` to tell that apart from
   * missing data, and `activity_label` for something to show a person.
   */
  activity: { id: string; name: string; emoji: string | null } | null;
  /**
   * Renewals already sold but not yet started, soonest first. Renewing before
   * the current term runs out never overwrites it: the new period queues
   * behind it, and both are kept.
   */
  upcoming_periods: ContractPeriodSummary[];
  all_access: boolean;
  /** The activity's name, or the names of everything the plan covers. Never empty. */
  activity_label: string;
  client: { id: string; full_name: string; phone: string | null };
}
