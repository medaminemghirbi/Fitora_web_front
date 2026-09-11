import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_BASE_URL } from "../models/api-config";
import { HrService } from "./hr.service";

describe("HrService", () => {
  let service: HrService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(HrService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("employeeFile GETs the staff member's file", () => {
    service.employeeFile("sm1").subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/staff/sm1`);
    expect(req.request.method).toBe("GET");
    req.flush({ staff_member: {}, current_work_contract: null, paid_leave_balance: {} });
  });

  it("contractTypes GETs the catalog", () => {
    service.contractTypes().subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/work_contract_types`);
    expect(req.request.method).toBe("GET");
    req.flush({ work_contract_types: [] });
  });

  it("createContractType POSTs a wrapped payload", () => {
    service.createContractType({ name: "CDI" }).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/work_contract_types`);
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({ work_contract_type: { name: "CDI" } });
    req.flush({ work_contract_type: {} });
  });

  it("updateContractType PATCHes a wrapped payload", () => {
    service.updateContractType("wct1", { name: "CDD" }).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/work_contract_types/wct1`);
    expect(req.request.method).toBe("PATCH");
    req.flush({ work_contract_type: {} });
  });

  it("deleteContractType DELETEs it", () => {
    service.deleteContractType("wct1").subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/work_contract_types/wct1`);
    expect(req.request.method).toBe("DELETE");
    req.flush(null);
  });

  it("absenceTypes GETs the catalog", () => {
    service.absenceTypes().subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/absence_types`);
    expect(req.request.method).toBe("GET");
    req.flush({ absence_types: [] });
  });

  it("createAbsenceType POSTs a wrapped payload", () => {
    service.createAbsenceType({ name: "Sick leave" }).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/absence_types`);
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({ absence_type: { name: "Sick leave" } });
    req.flush({ absence_type: {} });
  });

  it("updateAbsenceType PATCHes a wrapped payload", () => {
    service.updateAbsenceType("at1", { name: "PTO" }).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/absence_types/at1`);
    expect(req.request.method).toBe("PATCH");
    req.flush({ absence_type: {} });
  });

  it("deleteAbsenceType DELETEs it", () => {
    service.deleteAbsenceType("at1").subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/absence_types/at1`);
    expect(req.request.method).toBe("DELETE");
    req.flush(null);
  });

  it("contracts GETs with a staff_member_id param", () => {
    service.contracts("sm1").subscribe();
    const req = httpMock.expectOne((r) => r.url === `${API_BASE_URL}/work_contracts`);
    expect(req.request.params.get("staff_member_id")).toBe("sm1");
    req.flush({ work_contracts: [] });
  });

  it("contractsByCoach GETs with a coach_id param", () => {
    service.contractsByCoach("co1").subscribe();
    const req = httpMock.expectOne((r) => r.url === `${API_BASE_URL}/work_contracts`);
    expect(req.request.params.get("coach_id")).toBe("co1");
    req.flush({ work_contracts: [] });
  });

  it("createContract POSTs a wrapped payload", () => {
    service.createContract({ staff_member_id: "sm1" }).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/work_contracts`);
    expect(req.request.method).toBe("POST");
    req.flush({ work_contract: {} });
  });

  it("updateContract PATCHes a wrapped payload", () => {
    service.updateContract("wc1", { base_salary_cents: 1000 } as never).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/work_contracts/wc1`);
    expect(req.request.method).toBe("PATCH");
    req.flush({ work_contract: {} });
  });

  it("deleteContract DELETEs it", () => {
    service.deleteContract("wc1").subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/work_contracts/wc1`);
    expect(req.request.method).toBe("DELETE");
    req.flush(null);
  });

  it("leave GETs with a staff_member_id param", () => {
    service.leave("sm1").subscribe();
    const req = httpMock.expectOne((r) => r.url === `${API_BASE_URL}/leave_requests`);
    expect(req.request.params.get("staff_member_id")).toBe("sm1");
    req.flush({ leave_requests: [] });
  });

  it("createLeave POSTs a wrapped payload", () => {
    service.createLeave({ staff_member_id: "sm1" }).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/leave_requests`);
    expect(req.request.method).toBe("POST");
    req.flush({ leave_request: {} });
  });

  it("updateLeave PATCHes a wrapped payload", () => {
    service.updateLeave("lr1", { status: "approved" }).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/leave_requests/lr1`);
    expect(req.request.method).toBe("PATCH");
    req.flush({ leave_request: {} });
  });

  it("deleteLeave DELETEs it", () => {
    service.deleteLeave("lr1").subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/leave_requests/lr1`);
    expect(req.request.method).toBe("DELETE");
    req.flush(null);
  });

  it("payroll GETs with a month param", () => {
    service.payroll("2026-01").subscribe();
    const req = httpMock.expectOne((r) => r.url === `${API_BASE_URL}/owner/payroll`);
    expect(req.request.params.get("month")).toBe("2026-01");
    req.flush({});
  });

  it("payrollPdf GETs a blob, with an optional staff_member_id", () => {
    service.payrollPdf("2026-01", "sm1").subscribe();
    const req = httpMock.expectOne((r) => r.url === `${API_BASE_URL}/owner/payroll/export`);
    expect(req.request.params.get("month")).toBe("2026-01");
    expect(req.request.params.get("staff_member_id")).toBe("sm1");
    expect(req.request.responseType).toBe("blob");
    req.flush(new Blob());
  });
});
