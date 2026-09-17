import { ContractType } from "./contract-type.model";

export type ContractStatus = "pending" | "active" | "expired" | "cancelled";
export type PaymentStatus = "unpaid" | "paid";

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
  // What's still owed — the full price when unpaid, 0 when paid (no part payments).
  amount_due: string;
  plan: ContractType;
  activity: { id: string; name: string; emoji: string | null };
  client: { id: string; full_name: string; phone: string | null };
}
