import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../models/api-config";
import { ContractType } from "../models/contract-type.model";

export type ContractTypePayload = Partial<
  Pick<
    ContractType,
    "name" | "description" | "price" | "currency" | "billing_period" | "session_count" | "unlimited_bookings" | "booking_limit" | "priority_booking" | "color" | "active"
  >
> & { activity_ids?: string[] };

@Injectable({ providedIn: "root" })
export class ContractTypesService {
  constructor(private readonly http: HttpClient) {}

  list(): Observable<{ plans: ContractType[] }> {
    return this.http.get<{ plans: ContractType[] }>(`${API_BASE_URL}/contract_types`);
  }

  get(id: string): Observable<{ plan: ContractType }> {
    return this.http.get<{ plan: ContractType }>(`${API_BASE_URL}/contract_types/${id}`);
  }

  create(payload: ContractTypePayload): Observable<{ plan: ContractType }> {
    const { activity_ids, ...planFields } = payload;
    return this.http.post<{ plan: ContractType }>(`${API_BASE_URL}/contract_types`, {
      contract_type: planFields,
      activity_ids,
    });
  }

  update(id: string, payload: ContractTypePayload): Observable<{ plan: ContractType }> {
    const { activity_ids, ...planFields } = payload;
    return this.http.patch<{ plan: ContractType }>(`${API_BASE_URL}/contract_types/${id}`, {
      contract_type: planFields,
      activity_ids,
    });
  }
}
