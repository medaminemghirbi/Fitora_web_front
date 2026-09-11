import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../models/api-config";

export interface SubscriptionPricing {
  currencies: string[];
  currency: string;
  monthly_cents: number;
  annual_discount_percent: number;
  annual_cents: number;
  companies_count: number;
}

// The platform's monthly subscription price (per currency) + the global
// annual-billing discount. Admin-only.
@Injectable({ providedIn: "root" })
export class AdminSubscriptionPricingService {
  constructor(private readonly http: HttpClient) {}

  get(currency?: string): Observable<SubscriptionPricing> {
    const params: Record<string, string> = {};
    if (currency) params["currency"] = currency;
    return this.http.get<SubscriptionPricing>(`${API_BASE_URL}/admin/subscription_pricing`, { params });
  }

  update(payload: { currency?: string; monthly_cents?: number; annual_discount_percent?: number }): Observable<SubscriptionPricing> {
    return this.http.patch<SubscriptionPricing>(`${API_BASE_URL}/admin/subscription_pricing`, payload);
  }
}
