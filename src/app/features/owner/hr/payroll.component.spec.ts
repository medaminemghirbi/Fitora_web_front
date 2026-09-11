import { HttpErrorResponse } from "@angular/common/http";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router, convertToParamMap } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { of, ReplaySubject, throwError } from "rxjs";
import { PayrollEmployee, PayrollSheet } from "../../../core/models/work-contract.model";
import { HrService } from "../../../core/services/hr.service";
import { ToastService } from "../../../core/services/toast.service";
import { PayrollComponent } from "./payroll.component";

describe("PayrollComponent", () => {
  let fixture: ComponentFixture<PayrollComponent>;
  let component: PayrollComponent;
  let hr: jasmine.SpyObj<HrService>;
  let router: Router;
  let toast: ToastService;
  let paramMap$: ReplaySubject<ReturnType<typeof convertToParamMap>>;

  const employeeA: PayrollEmployee = {
    staff_member_id: "sm1", name: "Amy A", role: "receptionist", job_title: null,
    contract: { type: "cdi", type_name: "CDI", reference: null, cnss_number: null, starts_on: "2026-01-01", ends_on: null, status: "active" },
    gross_monthly_salary: 1000, allowances: [], allowances_total: 0, total_monthly_gross: 1000, currency: "TND",
    working_days: 22, worked_days: 20, absence_days: 2, paid_absence_days: 2, unpaid_absence_days: 0,
    estimated_gross: 1000, absences: [], days: [{ date: "2026-01-01", weekday: 4, code: "worked", abbr: null }],
  };
  const employeeB: PayrollEmployee = { ...employeeA, staff_member_id: "sm2", name: "Bo B" };
  const sheet: PayrollSheet = { month: "2026-01", month_label: "Janvier 2026", working_days: 22, currency: "TND", employees: [employeeA, employeeB] };

  function build(staffMemberId: string | null): void {
    TestBed.resetTestingModule();
    hr = jasmine.createSpyObj<HrService>("HrService", ["payroll", "payrollPdf"]);
    hr.payroll.and.returnValue(of(sheet));
    paramMap$ = new ReplaySubject(1);
    paramMap$.next(convertToParamMap(staffMemberId ? { staffMemberId } : {}));

    TestBed.configureTestingModule({
      imports: [PayrollComponent, TranslateModule.forRoot()],
      providers: [
        { provide: HrService, useValue: hr },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: paramMap$, snapshot: { paramMap: convertToParamMap(staffMemberId ? { staffMemberId } : {}) } },
        },
      ],
    });

    fixture = TestBed.createComponent(PayrollComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, "navigate");
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();
  }

  beforeEach(() => build("sm2"));

  it("loads the payroll sheet for the current month", () => {
    expect(component.sheet()).toEqual(sheet);
    expect(component.loading()).toBe(false);
  });

  it("sets the error flag when loading fails", () => {
    hr.payroll.and.returnValue(throwError(() => new Error("nope")));
    component.load();
    expect(component.error()).toBe(true);
  });

  it("selected() resolves the employee from the route id", () => {
    expect(component.selected()?.staff_member_id).toBe("sm2");
    expect(component.selectedIndex()).toBe(1);
  });

  it("redirects to the first employee when the route id is missing or unknown", () => {
    build(null);
    expect(router.navigate).toHaveBeenCalledWith(["/owner/hr/payroll", "sm1"], { replaceUrl: true });
  });

  it("onMonthChange reloads for the new month", () => {
    component.onMonthChange("2026-02");
    expect(component.month()).toBe("2026-02");
    expect(hr.payroll).toHaveBeenCalledWith("2026-02");
  });

  it("onMonthChange ignores an empty value", () => {
    const before = component.month();
    component.onMonthChange("");
    expect(component.month()).toBe(before);
  });

  it("goTo navigates to the given employee", () => {
    component.goTo("sm1");
    expect(router.navigate).toHaveBeenCalledWith(["/owner/hr/payroll", "sm1"], { replaceUrl: false });
  });

  it("step moves to the next/previous employee, wrapping around", () => {
    component.step(1);
    expect(router.navigate).toHaveBeenCalledWith(["/owner/hr/payroll", "sm1"], { replaceUrl: false });
    (router.navigate as jasmine.Spy).calls.reset();
    component.step(-1);
    expect(router.navigate).toHaveBeenCalledWith(["/owner/hr/payroll", "sm1"], { replaceUrl: false });
  });

  it("pad computes the Monday-first leading blank count", () => {
    expect(component.pad(1)).toEqual([]); // Monday
    expect(component.pad(0)).toEqual(new Array(6)); // Sunday -> 6 blanks
  });

  it("dayClass builds the modifier class", () => {
    expect(component.dayClass("worked")).toBe("payroll-day payroll-day--worked");
  });

  it("dayLabel maps known codes and falls back to the abbreviation", () => {
    expect(component.dayLabel("worked", null)).toBe("T");
    expect(component.dayLabel("off", null)).toBe("·");
    expect(component.dayLabel("na", null)).toBe("");
    expect(component.dayLabel("leave_paid", "CP")).toBe("CP");
  });

  it("downloadPdf exports the whole team when called with no employee", async () => {
    hr.payrollPdf.and.returnValue(of(new Blob(["x"], { type: "application/pdf" })));
    await component.downloadPdf();
    expect(hr.payrollPdf).toHaveBeenCalledWith(component.month(), undefined);
    expect(component.exporting()).toBeNull();
  });

  it("downloadPdf exports a single employee's sheet", async () => {
    hr.payrollPdf.and.returnValue(of(new Blob(["x"], { type: "application/pdf" })));
    await component.downloadPdf(employeeA);
    expect(hr.payrollPdf).toHaveBeenCalledWith(component.month(), "sm1");
  });

  it("downloadPdf shows the blob's error code, or a generic message otherwise", async () => {
    hr.payrollPdf.and.returnValue(throwError(() => new HttpErrorResponse({ status: 422 })));
    await component.downloadPdf();
    expect(component.exporting()).toBeNull();
    expect(toast.toasts()[0].kind).toBe("error");
  });
});
