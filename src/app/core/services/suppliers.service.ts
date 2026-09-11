import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../models/api-config";
import { Supplier, SupplierPayload } from "../models/supplier.model";
import { toFormData } from "./form-data.util";

@Injectable({ providedIn: "root" })
export class SuppliersService {
  constructor(private readonly http: HttpClient) {}

  list(search?: string): Observable<{ suppliers: Supplier[] }> {
    const params: Record<string, string> = {};
    if (search) params["search"] = search;
    return this.http.get<{ suppliers: Supplier[] }>(`${API_BASE_URL}/suppliers`, { params });
  }

  create(payload: SupplierPayload): Observable<{ supplier: Supplier }> {
    return this.http.post<{ supplier: Supplier }>(`${API_BASE_URL}/suppliers`, toFormData("supplier", payload));
  }

  update(id: string, payload: Partial<SupplierPayload>): Observable<{ supplier: Supplier }> {
    return this.http.patch<{ supplier: Supplier }>(`${API_BASE_URL}/suppliers/${id}`, toFormData("supplier", payload));
  }

  // Soft-deactivate (mirrors Coach) — a supplier with past orders stays on record.
  deactivate(id: string): Observable<{ supplier: Supplier }> {
    return this.http.delete<{ supplier: Supplier }>(`${API_BASE_URL}/suppliers/${id}`);
  }
}
