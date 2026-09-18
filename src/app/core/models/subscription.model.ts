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

  // ---- paying, month by month ---------------------------------------------
  /** The last day covered by what the gym has paid. null = never paid. */
  paid_through: string | null;
  /** Whether the period we are in is settled. */
  current_period_paid: boolean;
  /** Past the paid period and past the three days of grace. */
  payment_overdue: boolean;
  /** Days left before access closes. null when nothing is ticking. */
  days_before_lock: number | null;
  /** Why access is closed, or null when it is open. */
  lock_reason: "suspended" | "trial_expired" | "term_ended" | "payment_overdue" | null;
}
