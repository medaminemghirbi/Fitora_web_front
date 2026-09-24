export type BillingPeriod = "monthly" | "yearly";

/** Why access is closed, or null when it is open. Two reasons, never four. */
export type LockReason = "suspended" | "unpaid" | null;

/**
 * A gym's access to Gymly.
 *
 * `active` IS the access — nothing computes a date to read it. Everything
 * else here is what the invoices say, for the screens that show a countdown.
 */
export interface Subscription {
  id: string;
  active: boolean;
  billing_period: BillingPeriod | null;
  lock_reason: LockReason;
  /** The last day covered by an invoice. null = never paid. */
  paid_through: string | null;
  current_period_paid: boolean;
  /** Days left before the nightly sweep closes access. null = nothing ticking. */
  days_before_lock: number | null;
  /**
   * Nothing paid yet: the last period on record is the free one signup gave
   * away, running or run out. No tier is chosen while this is true.
   */
  trial: boolean;
  /** Free days left, today included. null outside a trial. */
  trial_days_left: number | null;
}

/** One period of access, paid for and recorded. The gym downloads it. */
export interface Invoice {
  id: string;
  number: string;
  period_start: string;
  period_end: string;
  /** Frozen at issue — never today's tariff. */
  amount: number;
  currency: string;
  billing_period: BillingPeriod;
  /** The free period signup gave away. */
  trial: boolean;
  issued_at: string;
  issued_by: string | null;
  notes: string | null;
}
