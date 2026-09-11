export type PaymentRecordStatus = "paid" | "refunded" | "cancelled";
export type PaymentMethod = "cash" | "card" | "bank_transfer" | "other";

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  status: PaymentRecordStatus;
  notes: string | null;
  paid_at: string | null;
  created_at: string;
  client: { id: string; full_name: string; phone: string | null };
  company: { id: string; name: string };
  created_by: { id: string; full_name: string } | null;
  product_name: string | null;
}
