import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { CompanyService } from "../../../core/services/company.service";
import { ToastService } from "../../../core/services/toast.service";
import { SettingsPlanningComponent } from "./settings-planning.component";

describe("SettingsPlanningComponent", () => {
  let fixture: ComponentFixture<SettingsPlanningComponent>;
  let component: SettingsPlanningComponent;
  let companyService: jasmine.SpyObj<CompanyService>;
  let toast: ToastService;

  beforeEach(async () => {
    companyService = jasmine.createSpyObj<CompanyService>("CompanyService", ["get", "update"]);
    companyService.get.and.returnValue(of({ company: { business_hours_start: "06:00", business_hours_end: "22:00", working_days: [1, 2, 3] } as never }));

    await TestBed.configureTestingModule({
      imports: [SettingsPlanningComponent, TranslateModule.forRoot()],
      providers: [
        { provide: CompanyService, useValue: companyService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsPlanningComponent);
    component = fixture.componentInstance;
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it("loads business hours and working days on init", () => {
    expect(component.form.value.business_hours_start).toBe("06:00");
    expect(component.workingDays()).toEqual([1, 2, 3]);
    expect(component.loading()).toBe(false);
  });

  it("defaults working days to Mon-Fri when none are set", () => {
    companyService.get.and.returnValue(of({ company: { business_hours_start: "06:00", business_hours_end: "22:00", working_days: null } as never }));
    fixture = TestBed.createComponent(SettingsPlanningComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.workingDays()).toEqual([1, 2, 3, 4, 5]);
  });

  it("stops loading even when the fetch fails", () => {
    fixture = TestBed.createComponent(SettingsPlanningComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it("isWorkingDay reflects the current selection", () => {
    expect(component.isWorkingDay(1)).toBe(true);
    expect(component.isWorkingDay(6)).toBe(false);
  });

  it("toggleDay adds/removes a day, keeping the list sorted", () => {
    component.toggleDay(0);
    expect(component.workingDays()).toEqual([0, 1, 2, 3]);
    component.toggleDay(1);
    expect(component.workingDays()).toEqual([0, 2, 3]);
  });

  it("submit does nothing with an invalid form", () => {
    component.form.controls.business_hours_start.setValue("");
    component.submit();
    expect(companyService.update).not.toHaveBeenCalled();
  });

  it("submit requires at least one working day", () => {
    component.workingDays.set([]);
    component.submit();
    expect(companyService.update).not.toHaveBeenCalled();
    expect(toast.toasts()[0].kind).toBe("error");
  });

  it("saves the hours and the working days in one call — they are both the company's", () => {
    companyService.update.and.returnValue(of({ company: {} as never }));

    component.submit();

    expect(companyService.update).toHaveBeenCalledWith(
      jasmine.objectContaining({ business_hours_start: "06:00", working_days: [1, 2, 3] })
    );
    expect(component.saving()).toBe(false);
    expect(toast.toasts()[0].kind).toBe("success");
  });

  it("submit shows an error toast on failure", () => {
    companyService.update.and.returnValue(throwError(() => new Error("nope")));
    component.submit();
    expect(component.saving()).toBe(false);
    expect(toast.toasts()[0].kind).toBe("error");
  });
});
