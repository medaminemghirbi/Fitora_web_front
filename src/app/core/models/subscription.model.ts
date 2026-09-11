export type BillingPeriod = "monthly" | "yearly";

export interface Subscription {
  id: string;
  status: "active" | "inactive" | "expired" | "cancelled";
  starts_at: string;
  expires_at: string | null;
  billing_period: BillingPeriod | null;
  on_trial: boolean;
  upgrade_requested_at: string | null;
  upgrade_requested_period: BillingPeriod | null;
}
