import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../models/api-config";
import { StaffMember } from "../models/staff-member.model";

export interface StaffCreatePayload {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  password: string;
  /** A Role id (from the company's roles). */
  role_id: string;
  coach_id?: string | null;
  birthdate?: string | null;
}

export interface StaffUpdatePayload {
  role_id?: string;
  active?: boolean;
  coach_id?: string | null;
  birthdate?: string | null;
}

@Injectable({ providedIn: "root" })
export class StaffService {
  constructor(private readonly http: HttpClient) {}

  list(): Observable<{ staff: StaffMember[] }> {
    return this.http.get<{ staff: StaffMember[] }>(`${API_BASE_URL}/staff`);
  }

  create(payload: StaffCreatePayload): Observable<{ staff_member: StaffMember }> {
    return this.http.post<{ staff_member: StaffMember }>(`${API_BASE_URL}/staff`, { staff_member: payload });
  }

  update(id: string, payload: StaffUpdatePayload): Observable<{ staff_member: StaffMember }> {
    return this.http.patch<{ staff_member: StaffMember }>(`${API_BASE_URL}/staff/${id}`, { staff_member: payload });
  }
}
