import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../models/api-config";
import { Booking } from "../models/booking.model";
import { Client, ClientDetail } from "../models/client.model";
import { Contract } from "../models/contract.model";
import { Payment } from "../models/payment.model";
import { PageMeta } from "./sessions.service";

export type ClientStatusFilter = "active" | "inactive" | "contract_active" | "contract_expired" | "no_contract";

export interface ClientFilters {
  search?: string;
  status?: ClientStatusFilter;
  page?: number;
  per_page?: number;
}

export type ClientPayload = Partial<
  Pick<
    Client,
    "first_name" | "last_name" | "email" | "phone" | "active"
  > & {
    date_of_birth: string | null;
    gender: string | null;
    address: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    notes: string | null;
  }
>;

export interface ClientShowResponse {
  client: ClientDetail;
  contracts: Contract[];
  bookings: Booking[];
  payments: Payment[];
}

/** `counts` feeds the filter rail: one entry per status plus "all". */
export interface ClientListResponse {
  clients: Client[];
  meta: PageMeta;
  counts: Record<string, number>;
}

@Injectable({ providedIn: "root" })
export class ClientsService {
  constructor(private readonly http: HttpClient) {}

  list(filters: ClientFilters = {}): Observable<ClientListResponse> {
    const params: Record<string, string> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") params[key] = String(value);
    });
    return this.http.get<ClientListResponse>(`${API_BASE_URL}/clients`, { params });
  }

  /** The current list as CSV — same filters, no pagination (backend-side). */
  exportCsv(filters: ClientFilters = {}): Observable<Blob> {
    const params: Record<string, string> = { format: "csv" };
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") params[key] = String(value);
    });
    return this.http.get(`${API_BASE_URL}/clients`, { params, responseType: "blob" });
  }

  get(id: string): Observable<ClientShowResponse> {
    return this.http.get<ClientShowResponse>(`${API_BASE_URL}/clients/${id}`);
  }

  create(payload: ClientPayload): Observable<{ client: Client }> {
    return this.http.post<{ client: Client }>(`${API_BASE_URL}/clients`, { client: payload });
  }

  update(id: string, payload: ClientPayload): Observable<{ client: Client }> {
    return this.http.patch<{ client: Client }>(`${API_BASE_URL}/clients/${id}`, { client: payload });
  }

  // Enables (or resets) the client's own mobile-app login — a separate,
  // narrower call than update() since it's a distinct, sensitive action
  // (see Client#login_enabled? on the backend).
}
