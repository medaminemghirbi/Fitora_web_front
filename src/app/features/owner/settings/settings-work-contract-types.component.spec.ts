import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { WorkContractType } from "../../../core/models/work-contract.model";
import { ConfirmService } from "../../../core/services/confirm.service";
import { HrService } from "../../../core/services/hr.service";
import { ToastService } from "../../../core/services/toast.service";
import { SettingsWorkContractTypesComponent } from "./settings-work-contract-types.component";

describe("SettingsWorkContractTypesComponent", () => {
  let fixture: ComponentFixture<SettingsWorkContractTypesComponent>;
  let component: SettingsWorkContractTypesComponent;
  let hr: jasmine.SpyObj<HrService>;
  let confirmService: ConfirmService;
  let toast: ToastService;

  const type: WorkContractType = { id: "wct1", name: "CDI", abbreviation: "CDI", fixed_term: false, active: true, position: 0, work_contracts_count: 2 };

  beforeEach(async () => {
    hr = jasmine.createSpyObj<HrService>("HrService", ["contractTypes", "createContractType", "updateContractType", "deleteContractType"]);
    hr.contractTypes.and.returnValue(of({ work_contract_types: [type] }));

    await TestBed.configureTestingModule({
      imports: [SettingsWorkContractTypesComponent, TranslateModule.forRoot()],
      providers: [{ provide: HrService, useValue: hr }],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsWorkContractTypesComponent);
    component = fixture.componentInstance;
    confirmService = TestBed.inject(ConfirmService);
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it("loads work contract types on init", () => {
    expect(component.types()).toEqual([type]);
  });

  it("stops loading even when the initial load fails", () => {
    hr.contractTypes.and.returnValue(throwError(() => new Error("nope")));
    fixture = TestBed.createComponent(SettingsWorkContractTypesComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it("filtered/meta reflect the search term", () => {
    component.search.set("cdi");
    expect(component.filtered().length).toBe(1);
    component.search.set("zzz");
    expect(component.meta().total).toBe(0);
  });

  it("openCreate resets the form", () => {
    component.openCreate();
    expect(component.editing()).toBeNull();
    expect(component.modalOpen()).toBe(true);
  });

  it("openEdit hydrates the form", () => {
    component.openEdit(type);
    expect(component.form.value.name).toBe("CDI");
  });

  it("submit does nothing with an invalid form", () => {
    component.submit();
    expect(hr.createContractType).not.toHaveBeenCalled();
  });

  it("submit creates a new type", () => {
    component.openCreate();
    component.form.patchValue({ name: "CDD", abbreviation: "CDD" });
    hr.createContractType.and.returnValue(of({ work_contract_type: type }));
    component.submit();
    expect(component.modalOpen()).toBe(false);
    expect(toast.toasts()[0].kind).toBe("success");
  });

  it("submit updates an existing type", () => {
    component.openEdit(type);
    hr.updateContractType.and.returnValue(of({ work_contract_type: type }));
    component.submit();
    expect(hr.updateContractType).toHaveBeenCalledWith("wct1", jasmine.any(Object));
  });

  it("submit shows the backend error on failure", () => {
    component.openCreate();
    component.form.patchValue({ name: "CDD", abbreviation: "CDD" });
    hr.createContractType.and.returnValue(throwError(() => new Error("nope")));
    component.submit();
    expect(component.formError()).toBeTruthy();
  });

  it("remove does nothing when declined", async () => {
    spyOn(confirmService, "ask").and.resolveTo(false);
    await component.remove(type);
    expect(hr.deleteContractType).not.toHaveBeenCalled();
  });

  it("remove deletes on confirmation", async () => {
    spyOn(confirmService, "ask").and.resolveTo(true);
    hr.deleteContractType.and.returnValue(of(undefined));
    await component.remove(type);
    expect(toast.toasts()[0].kind).toBe("success");
  });

  it("remove shows an error toast on failure", async () => {
    spyOn(confirmService, "ask").and.resolveTo(true);
    hr.deleteContractType.and.returnValue(throwError(() => new Error("nope")));
    await component.remove(type);
    expect(toast.toasts()[0].kind).toBe("error");
  });
});
