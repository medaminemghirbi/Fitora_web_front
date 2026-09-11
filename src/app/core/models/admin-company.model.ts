import { Subscription } from "./subscription.model";

export interface AdminCurrencyOption {
  code: string;
  symbol: string;
  name: string;
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
  mobile_auth_key: string;
  created_at: string;
  locations_count: number;
  owner: { id: string; full_name: string; email: string; phone: string | null };
  subscription: Subscription | null;
  trial_locked: boolean;
  trial_days_remaining: number | null;
  // The subscription price in the company's currency, read-only here.
  monthly_subscription_cents: number;
  annual_subscription_cents: number;
  annual_discount_percent: number;
  debt_cents: number;
  // Every feature is included for every company.
  included_modules: string[];
}
