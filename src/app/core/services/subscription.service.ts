import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../models/api-config";
import { BillingPeriod, Subscription } from "../models/subscription.model";

export interface SubscriptionInfo {
  subscription: Subscription | null;
  locations_used: number;
  clients_used: number;
  staff_used: number;
  locked: boolean;
  trial_days_remaining: number | null;
  on_trial: boolean;
  currency: string | null;
  currency_symbol: string | null;
  monthly_subscription_cents: number;
  annual_subscription_cents: number;
  annual_discount_percent: number;
  debt_cents: number;
  included_modules: string[];
}

// No plans, no add-ons — every feature is included. A platform admin sets
// the monthly price (per currency) and the annual discount, and activates
// the subscription off-app. The owner can request activation from here.
@Injectable({ providedIn: "root" })
export class SubscriptionService {
  constructor(private readonly http: HttpClient) {}

  get(): Observable<SubscriptionInfo> {
    return this.http.get<SubscriptionInfo>(`${API_BASE_URL}/subscription`);
  }

  /** Omit the period when the gym has no preference — the locked page does. */
  requestUpgrade(period?: BillingPeriod): Observable<SubscriptionInfo> {
    return this.http.post<SubscriptionInfo>(`${API_BASE_URL}/subscription/request_upgrade`, period ? { period } : {});
  }

  cancelUpgradeRequest(): Observable<SubscriptionInfo> {
    return this.http.delete<SubscriptionInfo>(`${API_BASE_URL}/subscription/request_upgrade`);
  }
}
