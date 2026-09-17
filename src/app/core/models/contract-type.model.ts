export type ContractBillingPeriod = "monthly" | "quarterly" | "semi_annual" | "yearly";

/** What one activity costs under one plan — the gym's pricing grid. */
export interface ActivityPrice {
  activity_id: string;
  activity_name: string;
  activity_emoji: string | null;
  price: number;
}

export interface ContractType {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  currency: string;
  billing_period: ContractBillingPeriod;
  duration_days: number;
  session_count: number | null;
  unlimited_bookings: boolean;
  booking_limit: number | null;
  priority_booking: boolean;
  color: string;
  active: boolean;
  activity_ids: string[];
  /** One row per activity this plan is sold for; an activity with no row isn't offered. */
  activity_prices: ActivityPrice[];
}
