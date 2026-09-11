import { ComponentFixture, TestBed, fakeAsync, tick } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { Contract } from "../../../core/models/contract.model";
import { ContractType } from "../../../core/models/contract-type.model";
import { ContractTypesService } from "../../../core/services/contract-types.service";
import { ContractsService } from "../../../core/services/contracts.service";
import { ContractsComponent } from "./contracts.component";

describe("ContractsComponent", () => {
  let fixture: ComponentFixture<ContractsComponent>;
  let component: ContractsComponent;
  let contractsService: jasmine.SpyObj<ContractsService>;
  let contractTypesService: jasmine.SpyObj<ContractTypesService>;

  const meta = { page: 1, per_page: 20, total: 1, total_pages: 1 };
  const contractType: ContractType = {
    id: "ct1",
    company_id: "1",
    name: "Basic",
    description: null,
    price: 100,
    currency: "TND",
    billing_period: "monthly",
    duration_days: 30,
    session_count: null,
    unlimited_bookings: true,
    booking_limit: null,
    priority_booking: false,
    color: "#000",
    active: true,
    location_ids: [],
    activity_ids: [],
  };
  const contract: Contract = {
    id: "m1",
    current_period_id: "p1",
    status: "active",
    starts_at: "2026-01-01",
    expires_at: "2026-02-01",
    remaining_bookings: null,
    auto_renew: true,
    discount: "0",
    final_price: "100",
    payment_status: "paid",
    amount_due: "0",
    plan: contractType,
    client: { id: "cl1", full_name: "Amy Client", phone: null },
  };

  beforeEach(async () => {
    contractsService = jasmine.createSpyObj<ContractsService>("ContractsService", ["list"]);
    contractTypesService = jasmine.createSpyObj<ContractTypesService>("ContractTypesService", ["list"]);
    contractsService.list.and.returnValue(of({ contracts: [contract], meta }));
    contractTypesService.list.and.returnValue(of({ plans: [contractType] }));

    await TestBed.configureTestingModule({
      imports: [ContractsComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: ContractsService, useValue: contractsService },
        { provide: ContractTypesService, useValue: contractTypesService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContractsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("loads contracts and the plan filter list on init", () => {
    expect(component.contracts().length).toBe(1);
    expect(component.plans().length).toBe(1);
  });

  it("sets the error flag when loading fails", () => {
    contractsService.list.and.returnValue(throwError(() => new Error("nope")));
    component.loadContracts();
    expect(component.error()).toBe(true);
  });

  it("onSearchChange debounces, resets to page 1", fakeAsync(() => {
    component.page.set(3);
    component.onSearchChange("amy");
    tick(1000);
    expect(component.page()).toBe(1);
    expect(contractsService.list).toHaveBeenCalledWith({ status: undefined, contract_type_id: undefined, q: "amy", page: 1 });
  }));

  it("onSearchChange cancels a pending debounce timer on rapid typing", fakeAsync(() => {
    component.onSearchChange("a");
    component.onSearchChange("am");
    tick(1000);
    expect(contractsService.list).toHaveBeenCalledWith(jasmine.objectContaining({ q: "am" }));
  }));

  it("applyContractFilter sets the status filter and reloads from page 1", () => {
    component.page.set(2);
    component.applyContractFilter("expired");
    expect(component.contractStatusFilter()).toBe("expired");
    expect(component.page()).toBe(1);
  });

  it("applyContractTypeFilter sets the plan filter and reloads from page 1", () => {
    component.applyContractTypeFilter("ct1");
    expect(component.contractTypeFilter()).toBe("ct1");
    expect(contractsService.list).toHaveBeenCalledWith({ status: undefined, contract_type_id: "ct1", q: undefined, page: 1 });
  });

  it("onPageChange loads the requested page", () => {
    component.onPageChange(2);
    expect(component.page()).toBe(2);
  });

  it("hasFilters/resetFilters", () => {
    component.applyContractFilter("active");
    expect(component.hasFilters()).toBe(true);
    component.resetFilters();
    expect(component.hasFilters()).toBe(false);
  });

  it("lists the 4 status filter options", () => {
    expect(component.statusOptions.map((o) => o.value)).toEqual(["", "active", "expired", "cancelled"]);
  });
});
