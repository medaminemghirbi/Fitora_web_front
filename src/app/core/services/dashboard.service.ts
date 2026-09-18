import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../models/api-config";
import { Company } from "../models/company.model";

export interface TodaysScheduleItem {
  id: string;
  starts_at: string;
  ends_at: string;
  activity_name: string;
  activity_emoji: string | null;
  coach_name: string | null;
  company_name: string;
  confirmed_count: number;
  capacity: number;
  status: string;
}

export interface ContractExpiringItem {
  id: string;
  client_name: string;
  plan_name: string;
  expires_at: string;
}

export interface RecentPaymentItem {
  id: string;
  client_name: string;
  amount: string;
  currency: string;
  paid_at: string;
}

export interface RecentClientItem {
  id: string;
  full_name: string;
  joined_at: string;
}

/** One kind of overdue work. `key` names the screen it opens. */
export interface AttentionRow {
  key: "expiring" | "unpaid" | "expired" | "sessions_without_coach";
  count: number;
  /** null when there is no money in it, or when the login may not read it. */
  amount: number | null;
}

export interface DashboardStats {
  total_clients: number;
  active_contracts: number;
  todays_bookings: number;
  todays_attendance: number;
  /** null when the login may not read what the gym earns (see the `revenue` capability). */
  outstanding_payments: string | null;
  todays_schedule: TodaysScheduleItem[];
  attention: AttentionRow[];
  contracts_expiring: ContractExpiringItem[];
  recent_payments: RecentPaymentItem[];
  recent_clients: RecentClientItem[];
}

export interface DashboardResponse {
  company: Company;
  stats: DashboardStats;
}

@Injectable({ providedIn: "root" })
export class DashboardService {
  constructor(private readonly http: HttpClient) {}

  get(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${API_BASE_URL}/owner/dashboard`);
  }
}
