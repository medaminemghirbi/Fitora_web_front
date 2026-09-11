import { Component, OnInit, computed, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { forkJoin } from "rxjs";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { HrService } from "../../../core/services/hr.service";
import { ConfirmService } from "../../../core/services/confirm.service";
import { ToastService } from "../../../core/services/toast.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import {
  AbsenceType,
  LeaveRequest,
  PaidLeaveBalance,
  WorkContract,
  WorkContractType,
} from "../../../core/models/work-contract.model";
import { StaffMember } from "../../../core/models/staff-member.model";
import { Coach } from "../../../core/models/coach.model";
import { CoachesService } from "../../../core/services/coaches.service";
import { CURRENCIES } from "../../../core/models/currency";
import { AvatarComponent } from "../../../shared/components/avatar.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";
import { ModalComponent } from "../../../shared/components/modal.component";
import { StatusBadgeComponent } from "../../../shared/components/status-badge.component";
import { MoneyPipe } from "../../../shared/pipes/money.pipe";
import { SkeletonComponent } from "../../../shared/ui/skeleton.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";
import { ActionMenuComponent } from "../../../shared/ui/action-menu.component";
import { DrawerComponent } from "../../../shared/ui/drawer.component";
import { KpiCardComponent } from "../../../shared/ui/kpi-card.component";

type Tab = "contract" | "leave";

@Component({
  selector: "app-employee-file",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    RouterLink,
    TranslateModule,
    AvatarComponent,
    EmptyStateComponent,
    ModalComponent,
    StatusBadgeComponent,
    MoneyPipe,
    SkeletonComponent,
    ErrorStateComponent,
    ActionMenuComponent,
    DrawerComponent,
    KpiCardComponent,
  ],
  templateUrl: "./employee-file.component.html",
  styleUrl: "./employee-file.component.scss",
})
export class EmployeeFileComponent implements OnInit {
  readonly currencies = CURRENCIES;

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly saving = signal(false);
  readonly tab = signal<Tab>("contract");

  readonly staffMember = signal<StaffMember | null>(null);
  readonly coach = signal<Coach | null>(null);
  readonly isCoach = signal(false);
  readonly balance = signal<PaidLeaveBalance | null>(null);

  // Unified employee identity — a back-office staff login or a login-less coach.
  readonly person = computed<{ name: string; email: string | null; roleKey: string; active: boolean } | null>(() => {
    const sm = this.staffMember();
    if (sm) return { name: sm.user.full_name, email: sm.user.email, roleKey: sm.role, active: sm.active };
    const c = this.coach();
    return c ? { name: c.full_name, email: c.email, roleKey: "coach", active: c.active } : null;
  });
  readonly contracts = signal<WorkContract[]>([]);
  readonly leaveRequests = signal<LeaveRequest[]>([]);
  readonly contractTypes = signal<WorkContractType[]>([]);
  readonly absenceTypes = signal<AbsenceType[]>([]);

  readonly currentContract = computed(
    () => this.contracts().find((c) => c.status === "active") ?? this.contracts()[0] ?? null
  );

  readonly paymentMethods = ["bank_transfer", "cash", "cheque"] as const;
  readonly contractStatuses = ["draft", "active", "ended", "terminated"] as const;

  private entityId = "";

  // ---- contract drawer ----
  readonly contractOpen = signal(false);
  readonly editingContract = signal<WorkContract | null>(null);
  readonly contractError = signal<string | null>(null);
  readonly contractForm = this.fb.nonNullable.group({
    work_contract_type_id: ["", Validators.required],
    reference: [""],
    job_title: [""],
    starts_on: ["", Validators.required],
    ends_on: [""],
    trial_period_end: [""],
    status: ["active" as WorkContract["status"], Validators.required],
    gross_monthly_salary: [0, [Validators.required, Validators.min(0)]],
    currency: ["TND"],
    hourly_rate: [null as number | null],
    weekly_hours: [null as number | null],
    payment_method: ["bank_transfer" as WorkContract["payment_method"]],
    bank_name: [""],
    bank_iban: [""],
    cnss_number: [""],
    cnss_affiliated_on: [""],
    paid_leave_days_per_year: [30, [Validators.required, Validators.min(0)]],
    notice_period_days: [null as number | null],
    terminated_on: [""],
    termination_reason: [""],
    notes: [""],
    allowances: this.fb.array<FormGroup<{ label: FormControl<string>; amount: FormControl<number> }>>([]),
  });

  get allowances() {
    return this.contractForm.controls.allowances;
  }

  // ---- leave modal ----
  readonly leaveOpen = signal(false);
  readonly editingLeave = signal<LeaveRequest | null>(null);
  readonly leaveError = signal<string | null>(null);
  readonly leaveForm = this.fb.nonNullable.group({
    absence_type_id: ["", Validators.required],
    starts_on: ["", Validators.required],
    ends_on: ["", Validators.required],
    days_count: [null as number | null],
    status: ["approved" as LeaveRequest["status"], Validators.required],
    reason: [""],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly hr: HrService,
    private readonly confirm: ConfirmService,
    private readonly toast: ToastService,
    private readonly translate: TranslateService,
    private readonly coaches: CoachesService,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.entityId = this.route.snapshot.paramMap.get("id") ?? "";
    this.isCoach.set(this.route.snapshot.data["entity"] === "coach");
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.isCoach() ? this.loadCoach() : this.loadStaff();
  }

  private loadStaff(): void {
    forkJoin({
      file: this.hr.employeeFile(this.entityId),
      contracts: this.hr.contracts(this.entityId),
      leave: this.hr.leave(this.entityId),
      types: this.hr.contractTypes(),
      absenceTypes: this.hr.absenceTypes(),
    }).subscribe({
      next: (res) => {
        this.staffMember.set(res.file.staff_member);
        this.balance.set(res.file.paid_leave_balance);
        this.contracts.set(res.contracts.work_contracts);
        this.leaveRequests.set(res.leave.leave_requests);
        this.contractTypes.set(res.types.work_contract_types.filter((t) => t.active || this.usesType(t.id)));
        this.absenceTypes.set(res.absenceTypes.absence_types.filter((t) => t.active));
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  private loadCoach(): void {
    this.tab.set("contract");
    forkJoin({
      coach: this.coaches.get(this.entityId),
      contracts: this.hr.contractsByCoach(this.entityId),
      types: this.hr.contractTypes(),
    }).subscribe({
      next: (res) => {
        this.coach.set(res.coach.coach);
        this.contracts.set(res.contracts.work_contracts);
        this.contractTypes.set(res.types.work_contract_types.filter((t) => t.active || this.usesType(t.id)));
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  private usesType(id: string): boolean {
    return this.contracts().some((c) => c.work_contract_type_id === id);
  }

  // ---------------------------------------------------------------- contract
  addAllowance(label = "", amount: number | null = null): void {
    this.allowances.push(
      this.fb.nonNullable.group({
        label: [label, Validators.required],
        amount: [amount ?? 0, [Validators.required, Validators.min(0)]],
      })
    );
  }

  removeAllowance(i: number): void {
    this.allowances.removeAt(i);
  }

  openContract(contract?: WorkContract): void {
    this.editingContract.set(contract ?? null);
    this.contractError.set(null);
    this.allowances.clear();

    if (contract) {
      this.contractForm.patchValue({
        work_contract_type_id: contract.work_contract_type_id,
        reference: contract.reference ?? "",
        job_title: contract.job_title ?? "",
        starts_on: contract.starts_on ?? "",
        ends_on: contract.ends_on ?? "",
        trial_period_end: contract.trial_period_end ?? "",
        status: contract.status,
        gross_monthly_salary: contract.gross_monthly_salary,
        currency: contract.currency,
        hourly_rate: contract.hourly_rate,
        weekly_hours: contract.weekly_hours,
        payment_method: contract.payment_method,
        bank_name: contract.bank_name ?? "",
        bank_iban: contract.bank_iban ?? "",
        cnss_number: contract.cnss_number ?? "",
        cnss_affiliated_on: contract.cnss_affiliated_on ?? "",
        paid_leave_days_per_year: contract.paid_leave_days_per_year,
        notice_period_days: contract.notice_period_days,
        terminated_on: contract.terminated_on ?? "",
        termination_reason: contract.termination_reason ?? "",
        notes: contract.notes ?? "",
      });
      contract.allowances.forEach((a) => this.addAllowance(a.label, a.amount));
    } else {
      this.contractForm.reset({
        status: "active",
        currency: this.currentContract()?.currency || "TND",
        gross_monthly_salary: 0,
        payment_method: "bank_transfer",
        paid_leave_days_per_year: 30,
        work_contract_type_id: "",
        hourly_rate: null,
        weekly_hours: null,
        notice_period_days: null,
      });
    }
    this.contractOpen.set(true);
  }

  submitContract(): void {
    if (this.contractForm.invalid) {
      this.contractForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.contractError.set(null);

    const v = this.contractForm.getRawValue();
    const payload = {
      ...v,
      staff_member_id: this.isCoach() ? null : this.entityId,
      coach_id: this.isCoach() ? this.entityId : null,
      ends_on: v.ends_on || null,
      trial_period_end: v.trial_period_end || null,
      cnss_affiliated_on: v.cnss_affiliated_on || null,
      terminated_on: v.terminated_on || null,
      allowances: v.allowances,
    };

    const editing = this.editingContract();
    const req = editing ? this.hr.updateContract(editing.id, payload) : this.hr.createContract(payload);

    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.contractOpen.set(false);
        this.toast.success(this.translate.instant("common.save"));
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.contractError.set(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }

  async deleteContract(contract: WorkContract): Promise<void> {
    const ok = await this.confirm.ask({
      title: this.translate.instant("hr.contract_delete_title"),
      body: this.translate.instant("hr.contract_delete_body"),
      danger: true,
    });
    if (!ok) return;
    this.hr.deleteContract(contract.id).subscribe({
      next: () => {
        this.toast.success(this.translate.instant("common.delete"));
        this.load();
      },
      error: (err) => this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic"))),
    });
  }

  // ------------------------------------------------------------------- leave
  openLeave(leave?: LeaveRequest): void {
    this.editingLeave.set(leave ?? null);
    this.leaveError.set(null);
    if (leave) {
      this.leaveForm.setValue({
        absence_type_id: leave.absence_type_id,
        starts_on: leave.starts_on,
        ends_on: leave.ends_on,
        days_count: leave.days_count,
        status: leave.status,
        reason: leave.reason ?? "",
      });
    } else {
      this.leaveForm.reset({
        absence_type_id: this.absenceTypes()[0]?.id ?? "",
        status: "approved",
        starts_on: "",
        ends_on: "",
        days_count: null,
        reason: "",
      });
    }
    this.leaveOpen.set(true);
  }

  submitLeave(): void {
    if (this.leaveForm.invalid) {
      this.leaveForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.leaveError.set(null);

    const v = this.leaveForm.getRawValue();
    const payload = {
      ...v,
      staff_member_id: this.entityId,
      days_count: v.days_count ?? undefined,
      reason: v.reason || undefined,
    };

    const editing = this.editingLeave();
    const req = editing ? this.hr.updateLeave(editing.id, payload) : this.hr.createLeave(payload);

    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.leaveOpen.set(false);
        this.toast.success(this.translate.instant("common.save"));
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.leaveError.set(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }

  async deleteLeave(leave: LeaveRequest): Promise<void> {
    const ok = await this.confirm.ask({
      title: this.translate.instant("hr.leave_delete_title"),
      body: this.translate.instant("hr.leave_delete_body"),
      danger: true,
    });
    if (!ok) return;
    this.hr.deleteLeave(leave.id).subscribe({
      next: () => {
        this.toast.success(this.translate.instant("common.delete"));
        this.load();
      },
      error: (err) => this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic"))),
    });
  }

  leaveStatusTone(status: string): string {
    return status === "approved" ? "active" : status === "rejected" ? "cancelled" : "pending";
  }
}
