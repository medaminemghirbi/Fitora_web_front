import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../models/api-config";

// 0 is the UNLIMITED sentinel (see SubscriptionPrice::UNLIMITED on the
// backend) — Postgres can't enforce uniqueness on NULL the way it can on 0.
export const UNLIMITED_TIER = 0;

export interface SubscriptionTier {
  company_limit: number;
  unlimited: boolean;
  monthly_cents: number;
  annual_cents: number;
}

export interface SubscriptionPricing {
  currencies: string[];
  currency: string;
  annual_discount_percent: number;
  tiers: SubscriptionTier[];
  companies_count: number;
}

// The platform's monthly subscription price per currency AND company-limit
// tier (1 / 3 / unlimited companies an owner may run) + the global
// annual-billing discount. Admin-only.
@Injectable({ providedIn: "root" })
export class AdminSubscriptionPricingService {
  constructor(private readonly http: HttpClient) {}

  get(currency?: string): Observable<SubscriptionPricing> {
    const params: Record<string, string> = {};
    if (currency) params["currency"] = currency;
    return this.http.get<SubscriptionPricing>(`${API_BASE_URL}/admin/subscription_pricing`, { params });
  }

  // `tiers` keys are company_limit values stringified ("1", "3", "0" for
  // unlimited) — any subset may be sent, omitted tiers are left as-is.
  update(payload: { currency?: string; tiers?: Record<string, number>; annual_discount_percent?: number }): Observable<SubscriptionPricing> {
    return this.http.patch<SubscriptionPricing>(`${API_BASE_URL}/admin/subscription_pricing`, payload);
  }
}
