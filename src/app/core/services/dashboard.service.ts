import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../models/api-config";
import { Company } from "../models/company.model";

export interface TodaysScheduleItem {
  id: string;
  starts_at: string;
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

export interface DashboardStats {
  total_clients: number;
  active_contracts: number;
  todays_bookings: number;
  todays_attendance: number;
  outstanding_payments: string;
  todays_schedule: TodaysScheduleItem[];
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
