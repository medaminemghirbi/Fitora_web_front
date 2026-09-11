import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../models/api-config";

export interface RevenueResponse {
  today: number;
  this_week: number;
  this_month: number;
  by_day: { date: string; total: number }[];
}

@Injectable({ providedIn: "root" })
export class RevenueService {
  constructor(private readonly http: HttpClient) {}

  get(): Observable<RevenueResponse> {
    return this.http.get<RevenueResponse>(`${API_BASE_URL}/owner/revenue`);
  }
}
