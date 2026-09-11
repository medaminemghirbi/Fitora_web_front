import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, convertToParamMap } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { ContractType } from "../../../core/models/contract-type.model";
import { ContractTypesService } from "../../../core/services/contract-types.service";
import { ToastService } from "../../../core/services/toast.service";
import { SettingsContractTypesComponent } from "./settings-contract-types.component";

describe("SettingsContractTypesComponent", () => {
  let fixture: ComponentFixture<SettingsContractTypesComponent>;
  let component: SettingsContractTypesComponent;
  let service: jasmine.SpyObj<ContractTypesService>;
  let toast: ToastService;

  const plan: ContractType = {
    id: "ct1", company_id: "1", name: "Basic", description: null, price: 100, currency: "TND",
    billing_period: "monthly", duration_days: 30, session_count: null, unlimited_bookings: true,
    booking_limit: null, priority_booking: false, color: "#000", active: true, location_ids: [], activity_ids: [],
  };

  function build(queryParams: Record<string, string> = {}): void {
    TestBed.resetTestingModule();
    service = jasmine.createSpyObj<ContractTypesService>("ContractTypesService", ["list", "create", "update"]);
    service.list.and.returnValue(of({ plans: [plan] }));

    TestBed.configureTestingModule({
      imports: [SettingsContractTypesComponent, TranslateModule.forRoot()],
      providers: [
        { provide: ContractTypesService, useValue: service },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } } },
      ],
    });

    fixture = TestBed.createComponent(SettingsContractTypesComponent);
    component = fixture.componentInstance;
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();
  }

  beforeEach(() => build());

  it("loads plans on init", () => {
    expect(component.plans()).toEqual([plan]);
  });

  it("opens the create modal automatically for ?action=new", () => {
    build({ action: "new" });
    expect(component.planModalOpen()).toBe(true);
  });

  it("filtered/meta reflect the search term", () => {
    component.search.set("basic");
    expect(component.filtered().length).toBe(1);
    component.search.set("zzz");
    expect(component.meta().total).toBe(0);
  });

  it("lists the 4 billing periods", () => {
    expect(component.billingPeriods).toEqual(["monthly", "quarterly", "semi_annual", "yearly"]);
  });

  it("openCreatePlan resets the form", () => {
    component.openCreatePlan();
    expect(component.editingPlan()).toBeNull();
    expect(component.planModalOpen()).toBe(true);
  });

  it("openEditPlan hydrates the form", () => {
    component.openEditPlan(plan);
    expect(component.editingPlan()).toBe(plan);
    expect(component.planForm.value.name).toBe("Basic");
  });

  it("closePlanModal closes it", () => {
    component.planModalOpen.set(true);
    component.closePlanModal();
    expect(component.planModalOpen()).toBe(false);
  });

  it("submitPlan does nothing with an invalid form", () => {
    component.planForm.reset();
    component.submitPlan();
    expect(service.create).not.toHaveBeenCalled();
  });

  it("submitPlan creates a new plan", () => {
    component.openCreatePlan();
    component.planForm.patchValue({ name: "Premium" });
    service.create.and.returnValue(of({ plan }));
    component.submitPlan();
    expect(component.planModalOpen()).toBe(false);
    expect(toast.toasts()[0].kind).toBe("success");
  });

  it("submitPlan updates an existing plan", () => {
    component.openEditPlan(plan);
    service.update.and.returnValue(of({ plan }));
    component.submitPlan();
    expect(service.update).toHaveBeenCalledWith("ct1", jasmine.any(Object));
  });

  it("submitPlan shows the backend error on failure", () => {
    component.openCreatePlan();
    component.planForm.patchValue({ name: "Premium" });
    service.create.and.returnValue(throwError(() => new Error("nope")));
    component.submitPlan();
    expect(component.formError()).toBeTruthy();
  });
});
