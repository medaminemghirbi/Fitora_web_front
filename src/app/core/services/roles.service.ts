import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../models/api-config";
import { Role, RolePayload, RolesResponse } from "../models/role.model";

@Injectable({ providedIn: "root" })
export class RolesService {
  constructor(private readonly http: HttpClient) {}

  list(): Observable<RolesResponse> {
    return this.http.get<RolesResponse>(`${API_BASE_URL}/roles`);
  }

  create(payload: RolePayload): Observable<{ role: Role }> {
    return this.http.post<{ role: Role }>(`${API_BASE_URL}/roles`, { role: payload });
  }

  update(id: string, payload: Partial<RolePayload>): Observable<{ role: Role }> {
    return this.http.patch<{ role: Role }>(`${API_BASE_URL}/roles/${id}`, { role: payload });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/roles/${id}`);
  }
}
