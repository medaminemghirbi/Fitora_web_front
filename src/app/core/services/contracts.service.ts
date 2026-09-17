import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../models/api-config";
import { Contract, ContractStatus } from "../models/contract.model";
import { PaymentMethod, Payment } from "../models/payment.model";
import { PageMeta } from "./sessions.service";

export interface CreateContractPayload {
  client_id: string;
  contract_type_id: string;
  activity_id: string;
  starts_on?: string;
  discount?: number;
  collect_payment?: boolean;
  payment_method?: PaymentMethod;
}

export interface UpdateContractPayload {
  starts_on?: string;
  expires_on?: string;
  discount?: number;
}

/** The extras the list screen shows beside the rows: rail counts, plan tabs
 *  and the portfolio strip. All computed on the searched set, backend-side. */
export interface ContractListResponse {
  contracts: Contract[];
  meta: PageMeta;
  counts: Record<string, number>;
  plan_counts: Record<string, number>;
  totals: {
    portfolio_value: number;
    average_basket: number;
    unpaid_value: number;
    expiring_soon: number;
  };
}

@Injectable({ providedIn: "root" })
export class ContractsService {
  constructor(private readonly http: HttpClient) {}

  list(filters: { status?: ContractStatus; contract_type_id?: string; q?: string; page?: number } = {}): Observable<ContractListResponse> {
    const params: Record<string, string> = { page: String(filters.page ?? 1) };
    if (filters.status) params["status"] = filters.status;
    if (filters.contract_type_id) params["contract_type_id"] = filters.contract_type_id;
    if (filters.q) params["q"] = filters.q;
    return this.http.get<ContractListResponse>(`${API_BASE_URL}/contracts`, { params });
  }

  create(payload: CreateContractPayload): Observable<{ contract: Contract; payment: Payment | null }> {
    return this.http.post<{ contract: Contract; payment: Payment | null }>(`${API_BASE_URL}/contracts`, payload);
  }

  // Edit the current period — start/end dates and (while unpaid) the discount.
  update(id: string, payload: UpdateContractPayload): Observable<{ contract: Contract }> {
    return this.http.patch<{ contract: Contract }>(`${API_BASE_URL}/contracts/${id}`, payload);
  }

  renew(id: string): Observable<{ contract: Contract }> {
    return this.http.post<{ contract: Contract }>(`${API_BASE_URL}/contracts/${id}/renew`, {});
  }

  cancel(id: string): Observable<{ contract: Contract }> {
    return this.http.post<{ contract: Contract }>(`${API_BASE_URL}/contracts/${id}/cancel`, {});
  }

  // Only allowed once a contract is already cancelled — see the backend's
  // ContractsController#destroy.
  destroy(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/contracts/${id}`);
  }

  // PDF receipt/invoice (Receipts::ContractPdf on the backend).
  receipt(id: string): Observable<Blob> {
    return this.http.get(`${API_BASE_URL}/contracts/${id}/receipt`, { responseType: "blob" });
  }
}
