import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { AbsenceType } from "../../../core/models/work-contract.model";
import { ConfirmService } from "../../../core/services/confirm.service";
import { HrService } from "../../../core/services/hr.service";
import { ToastService } from "../../../core/services/toast.service";
import { SettingsAbsenceTypesComponent } from "./settings-absence-types.component";

describe("SettingsAbsenceTypesComponent", () => {
  let fixture: ComponentFixture<SettingsAbsenceTypesComponent>;
  let component: SettingsAbsenceTypesComponent;
  let hr: jasmine.SpyObj<HrService>;
  let confirmService: ConfirmService;
  let toast: ToastService;

  const type: AbsenceType = { id: "at1", name: "Congé payé", abbreviation: "CP", paid: true, active: true, position: 0, leave_requests_count: 0 };

  beforeEach(async () => {
    hr = jasmine.createSpyObj<HrService>("HrService", ["absenceTypes", "createAbsenceType", "updateAbsenceType", "deleteAbsenceType"]);
    hr.absenceTypes.and.returnValue(of({ absence_types: [type] }));

    await TestBed.configureTestingModule({
      imports: [SettingsAbsenceTypesComponent, TranslateModule.forRoot()],
      providers: [{ provide: HrService, useValue: hr }],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsAbsenceTypesComponent);
    component = fixture.componentInstance;
    confirmService = TestBed.inject(ConfirmService);
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it("loads absence types on init", () => {
    expect(component.types()).toEqual([type]);
    expect(component.loading()).toBe(false);
  });

  it("stops loading even when the initial load fails", () => {
    hr.absenceTypes.and.returnValue(throwError(() => new Error("nope")));
    fixture = TestBed.createComponent(SettingsAbsenceTypesComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it("filtered/pagedTypes/meta reflect the search term", () => {
    expect(component.filtered().length).toBe(1);
    component.search.set("zzz");
    expect(component.filtered().length).toBe(0);
    expect(component.meta().total).toBe(0);
  });

  it("changing the search term resets to page 1", () => {
    component.page.set(3);
    component.search.set("cong");
    fixture.detectChanges();
    expect(component.page()).toBe(1);
  });

  it("openCreate resets the form", () => {
    component.openCreate();
    expect(component.editing()).toBeNull();
    expect(component.modalOpen()).toBe(true);
  });

  it("openEdit hydrates the form", () => {
    component.openEdit(type);
    expect(component.editing()).toBe(type);
    expect(component.form.value.abbreviation).toBe("CP");
  });

  it("submit does nothing with an invalid form", () => {
    component.submit();
    expect(hr.createAbsenceType).not.toHaveBeenCalled();
  });

  it("submit creates a new type", () => {
    component.openCreate();
    component.form.patchValue({ name: "Maladie", abbreviation: "MAL" });
    hr.createAbsenceType.and.returnValue(of({ absence_type: type }));
    component.submit();
    expect(component.modalOpen()).toBe(false);
    expect(toast.toasts()[0].kind).toBe("success");
  });

  it("submit updates an existing type", () => {
    component.openEdit(type);
    hr.updateAbsenceType.and.returnValue(of({ absence_type: type }));
    component.submit();
    expect(hr.updateAbsenceType).toHaveBeenCalledWith("at1", jasmine.any(Object));
  });

  it("submit shows the backend error on failure", () => {
    component.openCreate();
    component.form.patchValue({ name: "Maladie", abbreviation: "MAL" });
    hr.createAbsenceType.and.returnValue(throwError(() => new Error("nope")));
    component.submit();
    expect(component.formError()).toBeTruthy();
  });

  it("remove does nothing when declined", async () => {
    spyOn(confirmService, "ask").and.resolveTo(false);
    await component.remove(type);
    expect(hr.deleteAbsenceType).not.toHaveBeenCalled();
  });

  it("remove deletes on confirmation", async () => {
    spyOn(confirmService, "ask").and.resolveTo(true);
    hr.deleteAbsenceType.and.returnValue(of(undefined));
    await component.remove(type);
    expect(toast.toasts()[0].kind).toBe("success");
  });

  it("remove shows an error toast on failure", async () => {
    spyOn(confirmService, "ask").and.resolveTo(true);
    hr.deleteAbsenceType.and.returnValue(throwError(() => new Error("nope")));
    await component.remove(type);
    expect(toast.toasts()[0].kind).toBe("error");
  });
});
