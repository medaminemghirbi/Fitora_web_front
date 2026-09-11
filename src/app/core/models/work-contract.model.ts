export interface WorkContractType {
  id: string;
  name: string;
  abbreviation: string;
  fixed_term: boolean;
  active: boolean;
  position: number;
  work_contracts_count: number;
}

export type WorkContractStatus = "draft" | "active" | "ended" | "terminated";
export type WorkContractPaymentMethod = "bank_transfer" | "cash" | "cheque";

export interface Allowance {
  label: string;
  amount: number;
}

export interface WorkContract {
  id: string;
  // Exactly one of staff_member / coach is set.
  staff_member_id: string | null;
  staff_member: { id: string; full_name: string; role: string } | null;
  coach_id: string | null;
  coach: { id: string; full_name: string } | null;
  employee: { kind: "staff" | "coach"; id: string; full_name: string };
  work_contract_type_id: string;
  work_contract_type: { id: string; name: string; abbreviation: string; fixed_term: boolean };
  reference: string | null;
  job_title: string | null;
  starts_on: string;
  ends_on: string | null;
  trial_period_end: string | null;
  weekly_hours: number | null;
  gross_monthly_salary: number;
  hourly_rate: number | null;
  currency: string;
  payment_method: WorkContractPaymentMethod;
  bank_name: string | null;
  bank_iban: string | null;
  cnss_number: string | null;
  cnss_affiliated_on: string | null;
  allowances: Allowance[];
  allowances_total: number;
  total_monthly_gross: number;
  paid_leave_days_per_year: number;
  notice_period_days: number | null;
  terminated_on: string | null;
  termination_reason: string | null;
  status: WorkContractStatus;
  notes: string | null;
  created_at: string;
}

export interface AbsenceType {
  id: string;
  name: string;
  abbreviation: string;
  paid: boolean;
  active: boolean;
  position: number;
  leave_requests_count: number;
}

export type LeaveStatus = "pending" | "approved" | "rejected";

export interface LeaveRequest {
  id: string;
  staff_member_id: string;
  absence_type_id: string;
  absence_type: { id: string; name: string; abbreviation: string; paid: boolean };
  starts_on: string;
  ends_on: string;
  days_count: number;
  status: LeaveStatus;
  reason: string | null;
  recorded_by: { id: string; full_name: string } | null;
  created_at: string;
}

export interface PaidLeaveBalance {
  year: number;
  entitlement: number;
  taken: number;
  balance: number;
}

// ---- Payroll pre-sheet ----
export type PayrollDayCode = "worked" | "off" | "na" | "leave_paid" | "leave_unpaid";

export interface PayrollDay {
  date: string;
  weekday: number;
  code: PayrollDayCode;
  abbr: string | null;
}

export interface PayrollAbsence {
  absence_type: string;
  abbreviation: string;
  paid: boolean;
  days: number;
  recorded_days: number;
}

export interface PayrollEmployee {
  staff_member_id: string;
  name: string;
  role: string;
  job_title: string | null;
  contract: {
    type: string;
    type_name: string;
    reference: string | null;
    cnss_number: string | null;
    starts_on: string;
    ends_on: string | null;
    status: WorkContractStatus;
  };
  gross_monthly_salary: number;
  allowances: Allowance[];
  allowances_total: number;
  total_monthly_gross: number;
  currency: string;
  working_days: number;
  worked_days: number;
  absence_days: number;
  paid_absence_days: number;
  unpaid_absence_days: number;
  estimated_gross: number;
  absences: PayrollAbsence[];
  days: PayrollDay[];
}

export interface PayrollSheet {
  month: string;
  month_label: string;
  working_days: number;
  currency: string;
  employees: PayrollEmployee[];
}
