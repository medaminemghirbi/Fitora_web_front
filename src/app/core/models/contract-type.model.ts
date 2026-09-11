export type ContractBillingPeriod = "monthly" | "quarterly" | "semi_annual" | "yearly";

export interface ContractType {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  billing_period: ContractBillingPeriod;
  duration_days: number;
  session_count: number | null;
  unlimited_bookings: boolean;
  booking_limit: number | null;
  priority_booking: boolean;
  color: string;
  active: boolean;
  location_ids: string[];
  activity_ids: string[];
}
