import { Subscription } from "./subscription.model";

export interface AdminCurrencyOption {
  code: string;
  symbol: string;
  name: string;
}

/** What the gym is actually doing with Fitora — what an activation rests on. */
export interface AdminCompanyUsage {
  clients: number;
  staff: number;
  activities: number;
  sessions_last_30_days: number;
  last_session_at: string | null;
}

export interface AdminCompany {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  currency: string;
  currency_symbol: string;
  locale: string;
  active: boolean;
  created_at: string;
  owner: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    /**
     * The plan, as a number of gyms. It governs the OWNER, not this one
     * company: every gym they run shares it, and its price. null = unlimited.
     */
    company_limit: number | null;
    companies_count: number;
  };
  subscription: Subscription | null;
  /** Owed: periods with no invoice behind them, times the tariff. */
  arrears_cents: number;
  /**
   * What recording a payment would issue, now: the period and the amount.
   * During a trial it starts the day after the free days end.
   */
  next_invoice: { period_start: string; period_end: string; amount_cents: number } | null;
  usage: AdminCompanyUsage;
  access_open: boolean;
  // The subscription price in the company's currency, read-only here.
  monthly_subscription_cents: number;
  annual_subscription_cents: number;
  annual_discount_percent: number;
  // Every feature is included for every company.
  included_modules: string[];
}
