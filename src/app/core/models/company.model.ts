export interface Company {
  id: string;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  currency: string;
  // Short symbol for `currency` (e.g. "DT", "€") and the tenant-wide app
  // language — both Fitora-admin managed, shown read-only to the owner.
  currency_symbol: string;
  locale: string;
  // Days the company operates, as JS getDay() / Ruby wday integers
  // (0 = Sunday … 6 = Saturday). Edited in Settings > Planning.
  working_days: number[];
  active: boolean;
  slug: string | null;
  primary_color: string | null;
  logo_url: string | null;
  // Opening hours — on the company since the site was merged into it.
  business_hours_start: string;
  business_hours_end: string;
  // Set once the owner publishes the gym in the public directory.
  listed_at: string | null;
  // Every feature is included — the key list the subscription page renders
  // as "what's included".
  included_modules: string[];
  // The subscription price in the company's own currency, in cents.
  monthly_subscription_cents: number;
  annual_subscription_cents: number;
  annual_discount_percent: number;
  // What the company currently owes Fitora, in cents — set by hand by an
  // admin, shown read-only on the owner's subscription page.
}
