import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { CompanyService } from "../../../core/services/company.service";
import { LocationsService } from "../../../core/services/locations.service";
import { ToastService } from "../../../core/services/toast.service";
import { SettingsPlanningComponent } from "./settings-planning.component";

describe("SettingsPlanningComponent", () => {
  let fixture: ComponentFixture<SettingsPlanningComponent>;
  let component: SettingsPlanningComponent;
  let companyService: jasmine.SpyObj<CompanyService>;
  let locationsService: jasmine.SpyObj<LocationsService>;
  let toast: ToastService;

  beforeEach(async () => {
    companyService = jasmine.createSpyObj<CompanyService>("CompanyService", ["get", "update"]);
    locationsService = jasmine.createSpyObj<LocationsService>("LocationsService", ["get", "update"]);
    companyService.get.and.returnValue(of({ company: { working_days: [1, 2, 3] } as never }));
    locationsService.get.and.returnValue(of({ location: { business_hours_start: "08:00", business_hours_end: "20:00" } as never }));

    await TestBed.configureTestingModule({
      imports: [SettingsPlanningComponent, TranslateModule.forRoot()],
      providers: [
        { provide: CompanyService, useValue: companyService },
        { provide: LocationsService, useValue: locationsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsPlanningComponent);
    component = fixture.componentInstance;
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it("loads business hours and working days on init", () => {
    expect(component.form.value.business_hours_start).toBe("08:00");
    expect(component.workingDays()).toEqual([1, 2, 3]);
    expect(component.loading()).toBe(false);
  });

  it("defaults working days to Mon-Fri when none are set", () => {
    companyService.get.and.returnValue(of({ company: { working_days: null } as never }));
    fixture = TestBed.createComponent(SettingsPlanningComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.workingDays()).toEqual([1, 2, 3, 4, 5]);
  });

  it("stops loading even when the fetch fails", () => {
    locationsService.get.and.returnValue(throwError(() => new Error("nope")));
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
    expect(locationsService.update).not.toHaveBeenCalled();
  });

  it("submit requires at least one working day", () => {
    component.workingDays.set([]);
    component.submit();
    expect(locationsService.update).not.toHaveBeenCalled();
    expect(toast.toasts()[0].kind).toBe("error");
  });

  it("submit saves both the location hours and company working days", () => {
    locationsService.update.and.returnValue(of({ location: {} as never }));
    companyService.update.and.returnValue(of({ company: {} as never }));
    component.submit();
    expect(component.saving()).toBe(false);
    expect(toast.toasts()[0].kind).toBe("success");
  });

  it("submit shows an error toast on failure", () => {
    locationsService.update.and.returnValue(throwError(() => new Error("nope")));
    companyService.update.and.returnValue(of({ company: {} as never }));
    component.submit();
    expect(component.saving()).toBe(false);
    expect(toast.toasts()[0].kind).toBe("error");
  });
});
