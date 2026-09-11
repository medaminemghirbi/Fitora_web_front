import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, convertToParamMap } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { Coach } from "../../../core/models/coach.model";
import { StaffMember } from "../../../core/models/staff-member.model";
import { AbsenceType, LeaveRequest, WorkContract, WorkContractType } from "../../../core/models/work-contract.model";
import { CoachesService } from "../../../core/services/coaches.service";
import { ConfirmService } from "../../../core/services/confirm.service";
import { HrService } from "../../../core/services/hr.service";
import { ToastService } from "../../../core/services/toast.service";
import { EmployeeFileComponent } from "./employee-file.component";

describe("EmployeeFileComponent", () => {
  let fixture: ComponentFixture<EmployeeFileComponent>;
  let component: EmployeeFileComponent;
  let hr: jasmine.SpyObj<HrService>;
  let coachesService: jasmine.SpyObj<CoachesService>;
  let confirmService: ConfirmService;
  let toast: ToastService;

  const workContractType: WorkContractType = { id: "wct1", name: "CDI", abbreviation: "CDI", fixed_term: false, active: true, position: 0, work_contracts_count: 1 };
  const absenceType: AbsenceType = { id: "at1", name: "Congé payé", abbreviation: "CP", paid: true, active: true, position: 0, leave_requests_count: 0 };
  const workContract: WorkContract = {
    id: "wc1", staff_member_id: "sm1", staff_member: { id: "sm1", full_name: "Sami", role: "receptionist" },
    coach_id: null, coach: null, employee: { kind: "staff", id: "sm1", full_name: "Sami" },
    work_contract_type_id: "wct1", work_contract_type: workContractType, reference: "REF1", job_title: "Reception",
    starts_on: "2026-01-01", ends_on: null, trial_period_end: null, weekly_hours: 40, gross_monthly_salary: 1200,
    hourly_rate: null, currency: "TND", payment_method: "bank_transfer", bank_name: null, bank_iban: null,
    cnss_number: null, cnss_affiliated_on: null, allowances: [{ label: "Transport", amount: 50 }], allowances_total: 50,
    total_monthly_gross: 1250, paid_leave_days_per_year: 30, notice_period_days: null, terminated_on: null,
    termination_reason: null, status: "active", notes: null, created_at: "2026-01-01",
  };
  const staffMember: StaffMember = {
    id: "sm1", role: "receptionist", active: true, coach_id: null,
    user: { id: "u1", full_name: "Sami Owner", email: "sami@x.test" },
  } as never;
  const leave: LeaveRequest = {
    id: "l1", staff_member_id: "sm1", absence_type_id: "at1", absence_type: { id: "at1", name: "Congé payé", abbreviation: "CP", paid: true },
    starts_on: "2026-02-01", ends_on: "2026-02-05", days_count: 5, status: "approved", reason: null, recorded_by: null, created_at: "2026-01-01",
  };
  const coach: Coach = {
    id: "co1", company_id: "1", first_name: "Coach", last_name: "C", full_name: "Coach C", email: "coach@x.test",
    phone: null, bio: null, photo_url: null, birthdate: null, active: true, has_login: true, login_email: "coach@x.test", location_ids: [],
  };

  function build(entity: "staff" | "coach" = "staff"): void {
    TestBed.resetTestingModule();
    hr = jasmine.createSpyObj<HrService>("HrService", [
      "employeeFile", "contracts", "leave", "contractTypes", "absenceTypes",
      "contractsByCoach", "createContract", "updateContract", "deleteContract",
      "createLeave", "updateLeave", "deleteLeave",
    ]);
    coachesService = jasmine.createSpyObj<CoachesService>("CoachesService", ["get"]);

    hr.employeeFile.and.returnValue(of({ staff_member: staffMember, current_work_contract: workContract, paid_leave_balance: { year: 2026, entitlement: 30, taken: 5, balance: 25 } }));
    hr.contracts.and.returnValue(of({ work_contracts: [workContract] }));
    hr.contractsByCoach.and.returnValue(of({ work_contracts: [workContract] }));
    hr.leave.and.returnValue(of({ leave_requests: [leave] }));
    hr.contractTypes.and.returnValue(of({ work_contract_types: [workContractType] }));
    hr.absenceTypes.and.returnValue(of({ absence_types: [absenceType] }));
    coachesService.get.and.returnValue(of({ coach }));

    TestBed.configureTestingModule({
      imports: [EmployeeFileComponent, TranslateModule.forRoot()],
      providers: [
        { provide: HrService, useValue: hr },
        { provide: CoachesService, useValue: coachesService },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: entity === "staff" ? "sm1" : "co1" }), data: { entity } } } },
      ],
    });

    fixture = TestBed.createComponent(EmployeeFileComponent);
    component = fixture.componentInstance;
    confirmService = TestBed.inject(ConfirmService);
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();
  }

  beforeEach(() => build("staff"));

  it("loads the staff employee's file, contracts, leave and reference data", () => {
    expect(component.staffMember()).toEqual(staffMember);
    expect(component.contracts()).toEqual([workContract]);
    expect(component.leaveRequests()).toEqual([leave]);
    expect(component.balance()?.balance).toBe(25);
    expect(component.loading()).toBe(false);
  });

  it("sets the error flag when loading a staff member fails", () => {
    hr.employeeFile.and.returnValue(throwError(() => new Error("nope")));
    component.load();
    expect(component.error()).toBe(true);
  });

  it("loads a coach's file via the coach entity path", () => {
    build("coach");
    expect(component.coach()).toEqual(coach);
    expect(component.isCoach()).toBe(true);
    expect(component.tab()).toBe("contract");
  });

  it("sets the error flag when loading a coach fails", () => {
    build("coach");
    coachesService.get.and.returnValue(throwError(() => new Error("nope")));
    component.load();
    expect(component.error()).toBe(true);
  });

  it("person() reflects a staff member", () => {
    expect(component.person()).toEqual({ name: "Sami Owner", email: "sami@x.test", roleKey: "receptionist", active: true });
  });

  it("person() reflects a coach", () => {
    build("coach");
    expect(component.person()).toEqual({ name: "Coach C", email: "coach@x.test", roleKey: "coach", active: true });
  });

  it("currentContract prefers the active one, falling back to the first", () => {
    component.contracts.set([{ ...workContract, id: "old", status: "ended" }, { ...workContract, id: "new", status: "active" }]);
    expect(component.currentContract()?.id).toBe("new");
  });

  it("leaveStatusTone maps status to badge tone", () => {
    expect(component.leaveStatusTone("approved")).toBe("active");
    expect(component.leaveStatusTone("rejected")).toBe("cancelled");
    expect(component.leaveStatusTone("pending")).toBe("pending");
  });

  describe("contract type filtering", () => {
    it("drops an inactive contract type nobody uses", () => {
      hr.contracts.and.returnValue(of({ work_contracts: [] }));
      hr.contractTypes.and.returnValue(of({ work_contract_types: [{ ...workContractType, active: false }] }));
      component.load();
      expect(component.contractTypes()).toEqual([]);
    });

    it("keeps an inactive contract type still referenced by a contract", () => {
      hr.contractTypes.and.returnValue(of({ work_contract_types: [{ ...workContractType, active: false }] }));
      hr.contracts.and.returnValue(of({ work_contracts: [workContract] }));
      component.load();
      expect(component.contractTypes().length).toBe(1);
    });
  });

  describe("contract allowances", () => {
    it("addAllowance/removeAllowance manage the FormArray", () => {
      component.addAllowance("Bonus", 100);
      expect(component.allowances.length).toBe(1);
      component.removeAllowance(0);
      expect(component.allowances.length).toBe(0);
    });
  });

  describe("contract drawer", () => {
    it("openContract() with no contract resets to defaults", () => {
      component.openContract();
      expect(component.editingContract()).toBeNull();
      expect(component.contractOpen()).toBe(true);
      expect(component.contractForm.value.status).toBe("active");
    });

    it("openContract(contract) hydrates the form and allowances", () => {
      component.openContract(workContract);
      expect(component.editingContract()).toBe(workContract);
      expect(component.contractForm.value.reference).toBe("REF1");
      expect(component.allowances.length).toBe(1);
    });

    it("submitContract does nothing with an invalid form", () => {
      component.contractOpen.set(true);
      component.contractForm.reset();
      component.submitContract();
      expect(hr.createContract).not.toHaveBeenCalled();
    });

    it("submitContract creates a new contract for a staff member", () => {
      component.openContract();
      component.contractForm.patchValue({ work_contract_type_id: "wct1", starts_on: "2026-01-01" });
      hr.createContract.and.returnValue(of({ work_contract: workContract }));

      component.submitContract();

      expect(hr.createContract).toHaveBeenCalled();
      const payload = hr.createContract.calls.mostRecent().args[0] as { staff_member_id: string | null; coach_id: string | null };
      expect(payload.staff_member_id).toBe("sm1");
      expect(payload.coach_id).toBeNull();
      expect(component.contractOpen()).toBe(false);
      expect(toast.toasts()[0].kind).toBe("success");
    });

    it("submitContract updates an existing contract", () => {
      component.openContract(workContract);
      hr.updateContract.and.returnValue(of({ work_contract: workContract }));
      component.submitContract();
      expect(hr.updateContract).toHaveBeenCalledWith("wc1", jasmine.any(Object));
    });

    it("submitContract targets coach_id for a coach entity", () => {
      build("coach");
      component.openContract();
      component.contractForm.patchValue({ work_contract_type_id: "wct1", starts_on: "2026-01-01" });
      hr.createContract.and.returnValue(of({ work_contract: workContract }));
      component.submitContract();
      const payload = hr.createContract.calls.mostRecent().args[0] as { staff_member_id: string | null; coach_id: string | null };
      expect(payload.staff_member_id).toBeNull();
      expect(payload.coach_id).toBe("co1");
    });

    it("submitContract shows the backend error on failure", () => {
      component.openContract();
      component.contractForm.patchValue({ work_contract_type_id: "wct1", starts_on: "2026-01-01" });
      hr.createContract.and.returnValue(throwError(() => new Error("nope")));
      component.submitContract();
      expect(component.contractError()).toBeTruthy();
    });

    it("deleteContract does nothing when declined", async () => {
      spyOn(confirmService, "ask").and.resolveTo(false);
      await component.deleteContract(workContract);
      expect(hr.deleteContract).not.toHaveBeenCalled();
    });

    it("deleteContract deletes on confirmation", async () => {
      spyOn(confirmService, "ask").and.resolveTo(true);
      hr.deleteContract.and.returnValue(of(undefined));
      await component.deleteContract(workContract);
      expect(toast.toasts()[0].kind).toBe("success");
    });

    it("deleteContract shows an error toast on failure", async () => {
      spyOn(confirmService, "ask").and.resolveTo(true);
      hr.deleteContract.and.returnValue(throwError(() => new Error("nope")));
      await component.deleteContract(workContract);
      expect(toast.toasts()[0].kind).toBe("error");
    });
  });

  describe("leave modal", () => {
    it("openLeave() with no leave defaults to the first absence type", () => {
      component.openLeave();
      expect(component.leaveOpen()).toBe(true);
      expect(component.leaveForm.value.absence_type_id).toBe("at1");
    });

    it("openLeave(leave) hydrates the form", () => {
      component.openLeave(leave);
      expect(component.editingLeave()).toBe(leave);
      expect(component.leaveForm.value.days_count).toBe(5);
    });

    it("submitLeave does nothing with an invalid form", () => {
      component.leaveForm.reset();
      component.submitLeave();
      expect(hr.createLeave).not.toHaveBeenCalled();
    });

    it("submitLeave creates a new leave request", () => {
      component.openLeave();
      component.leaveForm.patchValue({ absence_type_id: "at1", starts_on: "2026-02-01", ends_on: "2026-02-05" });
      hr.createLeave.and.returnValue(of({ leave_request: leave }));
      component.submitLeave();
      expect(hr.createLeave).toHaveBeenCalled();
      expect(component.leaveOpen()).toBe(false);
    });

    it("submitLeave updates an existing leave request", () => {
      component.openLeave(leave);
      hr.updateLeave.and.returnValue(of({ leave_request: leave }));
      component.submitLeave();
      expect(hr.updateLeave).toHaveBeenCalledWith("l1", jasmine.any(Object));
    });

    it("submitLeave shows the backend error on failure", () => {
      component.openLeave();
      component.leaveForm.patchValue({ absence_type_id: "at1", starts_on: "2026-02-01", ends_on: "2026-02-05" });
      hr.createLeave.and.returnValue(throwError(() => new Error("nope")));
      component.submitLeave();
      expect(component.leaveError()).toBeTruthy();
    });

    it("deleteLeave does nothing when declined", async () => {
      spyOn(confirmService, "ask").and.resolveTo(false);
      await component.deleteLeave(leave);
      expect(hr.deleteLeave).not.toHaveBeenCalled();
    });

    it("deleteLeave deletes on confirmation", async () => {
      spyOn(confirmService, "ask").and.resolveTo(true);
      hr.deleteLeave.and.returnValue(of(undefined));
      await component.deleteLeave(leave);
      expect(toast.toasts()[0].kind).toBe("success");
    });

    it("deleteLeave shows an error toast on failure", async () => {
      spyOn(confirmService, "ask").and.resolveTo(true);
      hr.deleteLeave.and.returnValue(throwError(() => new Error("nope")));
      await component.deleteLeave(leave);
      expect(toast.toasts()[0].kind).toBe("error");
    });
  });
});
