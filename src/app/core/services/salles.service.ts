import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../models/api-config";
import { Salle } from "../models/salle.model";

export interface SallePayload {
  name?: string;
  description?: string | null;
  capacity?: number;
  active?: boolean;
  /** Omit to leave the existing gallery untouched (PATCH); send to replace it entirely. */
  images?: File[];
}

@Injectable({ providedIn: "root" })
export class SallesService {
  constructor(private readonly http: HttpClient) {}

  list(): Observable<{ salles: Salle[] }> {
    return this.http.get<{ salles: Salle[] }>(`${API_BASE_URL}/salles`);
  }

  get(id: string): Observable<{ salle: Salle }> {
    return this.http.get<{ salle: Salle }>(`${API_BASE_URL}/salles/${id}`);
  }

  create(payload: SallePayload): Observable<{ salle: Salle }> {
    return this.http.post<{ salle: Salle }>(`${API_BASE_URL}/salles`, this.toFormData(payload));
  }

  update(id: string, payload: SallePayload): Observable<{ salle: Salle }> {
    return this.http.patch<{ salle: Salle }>(`${API_BASE_URL}/salles/${id}`, this.toFormData(payload));
  }

  deactivate(id: string): Observable<{ salle: Salle }> {
    return this.http.delete<{ salle: Salle }>(`${API_BASE_URL}/salles/${id}`);
  }

  private toFormData(payload: SallePayload): FormData {
    const formData = new FormData();
    if (payload.name !== undefined) formData.append("salle[name]", payload.name);
    if (payload.description !== undefined) formData.append("salle[description]", payload.description ?? "");
    if (payload.capacity !== undefined) formData.append("salle[capacity]", String(payload.capacity));
    if (payload.active !== undefined) formData.append("salle[active]", String(payload.active));
    payload.images?.forEach((file) => formData.append("salle[images][]", file));
    return formData;
  }
}
