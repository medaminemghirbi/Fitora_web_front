import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../models/api-config";
import { Payment, PaymentMethod } from "../models/payment.model";
import { PageMeta } from "./sessions.service";

export interface PaymentFilters {
  status?: string;
  payment_method?: string;
  date?: string;
  q?: string;
  page?: number;
}

export interface RecordPaymentPayload {
  client_id: string;
  // Omit to settle the payable in full (no part payments).
  amount?: number;
  payment_method: PaymentMethod;
  notes?: string;
  contract_period_id?: string;
  booking_id?: string;
}

@Injectable({ providedIn: "root" })
export class PaymentsService {
  constructor(private readonly http: HttpClient) {}

  list(filters: PaymentFilters = {}): Observable<{ payments: Payment[]; meta: PageMeta }> {
    const params: Record<string, string> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") params[key] = String(value);
    });
    return this.http.get<{ payments: Payment[]; meta: PageMeta }>(`${API_BASE_URL}/payments`, { params });
  }

  get(id: string): Observable<{ payment: Payment }> {
    return this.http.get<{ payment: Payment }>(`${API_BASE_URL}/payments/${id}`);
  }

  record(payload: RecordPaymentPayload): Observable<{ payment: Payment }> {
    return this.http.post<{ payment: Payment }>(`${API_BASE_URL}/payments`, payload);
  }

  refund(id: string): Observable<{ payment: Payment }> {
    return this.http.post<{ payment: Payment }>(`${API_BASE_URL}/payments/${id}/refund`, {});
  }
}
