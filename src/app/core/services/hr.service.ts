import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../models/api-config";
import { StaffMember } from "../models/staff-member.model";
import {
  AbsenceType,
  LeaveRequest,
  PaidLeaveBalance,
  PayrollSheet,
  WorkContract,
  WorkContractType,
} from "../models/work-contract.model";

export interface EmployeeFile {
  staff_member: StaffMember;
  current_work_contract: WorkContract | null;
  paid_leave_balance: PaidLeaveBalance;
}

export type WorkContractPayload = Partial<
  Omit<WorkContract, "id" | "staff_member" | "coach" | "employee" | "work_contract_type" | "allowances_total" | "total_monthly_gross" | "created_at">
>;

export interface LeaveRequestPayload {
  staff_member_id?: string;
  absence_type_id?: string;
  starts_on?: string;
  ends_on?: string;
  days_count?: number;
  status?: string;
  reason?: string;
}

@Injectable({ providedIn: "root" })
export class HrService {
  constructor(private readonly http: HttpClient) {}

  // ---- employee file header ----
  employeeFile(staffMemberId: string): Observable<EmployeeFile> {
    return this.http.get<EmployeeFile>(`${API_BASE_URL}/staff/${staffMemberId}`);
  }

  // ---- work contract types ----
  contractTypes(): Observable<{ work_contract_types: WorkContractType[] }> {
    return this.http.get<{ work_contract_types: WorkContractType[] }>(`${API_BASE_URL}/work_contract_types`);
  }

  createContractType(payload: Partial<WorkContractType>): Observable<{ work_contract_type: WorkContractType }> {
    return this.http.post<{ work_contract_type: WorkContractType }>(`${API_BASE_URL}/work_contract_types`, { work_contract_type: payload });
  }

  updateContractType(id: string, payload: Partial<WorkContractType>): Observable<{ work_contract_type: WorkContractType }> {
    return this.http.patch<{ work_contract_type: WorkContractType }>(`${API_BASE_URL}/work_contract_types/${id}`, { work_contract_type: payload });
  }

  deleteContractType(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/work_contract_types/${id}`);
  }

  // ---- absence types ----
  absenceTypes(): Observable<{ absence_types: AbsenceType[] }> {
    return this.http.get<{ absence_types: AbsenceType[] }>(`${API_BASE_URL}/absence_types`);
  }

  createAbsenceType(payload: Partial<AbsenceType>): Observable<{ absence_type: AbsenceType }> {
    return this.http.post<{ absence_type: AbsenceType }>(`${API_BASE_URL}/absence_types`, { absence_type: payload });
  }

  updateAbsenceType(id: string, payload: Partial<AbsenceType>): Observable<{ absence_type: AbsenceType }> {
    return this.http.patch<{ absence_type: AbsenceType }>(`${API_BASE_URL}/absence_types/${id}`, { absence_type: payload });
  }

  deleteAbsenceType(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/absence_types/${id}`);
  }

  // ---- work contracts ----
  contracts(staffMemberId: string): Observable<{ work_contracts: WorkContract[] }> {
    return this.http.get<{ work_contracts: WorkContract[] }>(`${API_BASE_URL}/work_contracts`, {
      params: { staff_member_id: staffMemberId },
    });
  }

  contractsByCoach(coachId: string): Observable<{ work_contracts: WorkContract[] }> {
    return this.http.get<{ work_contracts: WorkContract[] }>(`${API_BASE_URL}/work_contracts`, {
      params: { coach_id: coachId },
    });
  }

  createContract(payload: WorkContractPayload): Observable<{ work_contract: WorkContract }> {
    return this.http.post<{ work_contract: WorkContract }>(`${API_BASE_URL}/work_contracts`, { work_contract: payload });
  }

  updateContract(id: string, payload: WorkContractPayload): Observable<{ work_contract: WorkContract }> {
    return this.http.patch<{ work_contract: WorkContract }>(`${API_BASE_URL}/work_contracts/${id}`, { work_contract: payload });
  }

  deleteContract(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/work_contracts/${id}`);
  }

  // ---- leave requests ----
  leave(staffMemberId: string): Observable<{ leave_requests: LeaveRequest[] }> {
    return this.http.get<{ leave_requests: LeaveRequest[] }>(`${API_BASE_URL}/leave_requests`, {
      params: { staff_member_id: staffMemberId },
    });
  }

  createLeave(payload: LeaveRequestPayload): Observable<{ leave_request: LeaveRequest }> {
    return this.http.post<{ leave_request: LeaveRequest }>(`${API_BASE_URL}/leave_requests`, { leave_request: payload });
  }

  updateLeave(id: string, payload: LeaveRequestPayload): Observable<{ leave_request: LeaveRequest }> {
    return this.http.patch<{ leave_request: LeaveRequest }>(`${API_BASE_URL}/leave_requests/${id}`, { leave_request: payload });
  }

  deleteLeave(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/leave_requests/${id}`);
  }

  // ---- payroll pre-sheet ----
  payroll(month: string): Observable<PayrollSheet> {
    return this.http.get<PayrollSheet>(`${API_BASE_URL}/owner/payroll`, { params: { month } });
  }

  payrollPdf(month: string, staffMemberId?: string): Observable<Blob> {
    const params: Record<string, string> = { month };
    if (staffMemberId) params["staff_member_id"] = staffMemberId;
    return this.http.get(`${API_BASE_URL}/owner/payroll/export`, { params, responseType: "blob" });
  }
}
