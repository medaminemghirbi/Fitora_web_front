import { ComponentFixture, TestBed, fakeAsync, tick } from "@angular/core/testing";
import { ActivatedRoute, convertToParamMap, provideRouter } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
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
    currency: "TND",
    billing_period: "monthly",
    duration_days: 30,
    session_count: null,
    unlimited_bookings: true,
    booking_limit: null,
    priority_booking: false,
    color: "#000",
    active: true,
    activity_ids: [],
    activity_prices: [{ activity_id: "a1", activity_name: "Yoga", activity_emoji: "🧘", price: 100 }],
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
    base_price: "100.00",
    final_price: "100",
    payment_status: "paid",
    amount_due: "0",
    plan: contractType,
    activity: { id: "a1", name: "Yoga", emoji: "\u{1F9D8}" },
    client: { id: "cl1", full_name: "Amy Client", phone: null },
  };

  beforeEach(async () => {
    contractsService = jasmine.createSpyObj<ContractsService>("ContractsService", ["list"]);
    contractTypesService = jasmine.createSpyObj<ContractTypesService>("ContractTypesService", ["list"]);
    contractsService.list.and.returnValue(of({ contracts: [contract], meta , counts: {}, plan_counts: {}, totals: { portfolio_value: 0, average_basket: 0, unpaid_value: 0, expiring_soon: 0 } }));
    contractTypesService.list.and.returnValue(of({ plans: [contractType] }));

    await TestBed.configureTestingModule({
      imports: [ContractsComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClientTesting(),
        provideHttpClient(),
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
    expect(contractsService.list).toHaveBeenCalledWith({ status: undefined, payment: undefined, contract_type_id: undefined, q: "amy", page: 1 });
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
    expect(contractsService.list).toHaveBeenCalledWith({ status: undefined, payment: undefined, contract_type_id: "ct1", q: undefined, page: 1 });
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

  it("lists the rail in the order a desk reads it: what is fine, what is running out, what has run out", () => {
    expect(component.statusOptions.map((o) => o.value)).toEqual([
      "",
      "active",
      "expiring",
      "expired",
      "pending",
      "cancelled",
    ]);
  });

  it("filterChips is empty with no active filters", () => {
    expect(component.filterChips()).toEqual([]);
  });

  it("filterChips reflects search, status, and plan filters", () => {
    component.onSearchChange("amy");
    component.applyContractFilter("active");
    component.applyContractTypeFilter("ct1");
    const chips = component.filterChips();
    expect(chips.length).toBe(3);
    expect(chips[0].label).toContain("amy");
    expect(chips[2].label).toBe("Basic");
  });

  it("a filter chip's clear() removes only that filter", fakeAsync(() => {
    component.onSearchChange("amy");
    component.applyContractFilter("active");
    tick(1000);
    const chips = component.filterChips();
    chips[1].clear();
    expect(component.contractStatusFilter()).toBe("");
    expect(component.search()).toBe("amy");
  }));

  it("omits a status/plan chip once its filter list hasn't loaded a matching option", () => {
    component.plans.set([]);
    component.applyContractTypeFilter("unknown");
    expect(component.filterChips()).toEqual([]);
  });
});

// "Aujourd'hui" links here already filtered; the page has to arrive holding
// that filter, not merely accept it once someone clicks the rail.
describe("ContractsComponent — arriving from the dashboard", () => {
  function buildWith(query: Record<string, string>): ContractsComponent {
    TestBed.resetTestingModule();
    const contractsService = jasmine.createSpyObj<ContractsService>("ContractsService", ["list"]);
    contractsService.list.and.returnValue(
      of({ contracts: [], meta: { page: 1, per_page: 20, total: 0, total_pages: 0 }, counts: {}, plan_counts: {}, totals: { portfolio_value: 0, average_basket: 0, unpaid_value: 0, expiring_soon: 0 } })
    );
    const contractTypesService = jasmine.createSpyObj<ContractTypesService>("ContractTypesService", ["list"]);
    contractTypesService.list.and.returnValue(of({ plans: [] }));

    TestBed.configureTestingModule({
      imports: [ContractsComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClientTesting(),
        provideHttpClient(),
        provideRouter([]),
        { provide: ContractsService, useValue: contractsService },
        { provide: ContractTypesService, useValue: contractTypesService },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query) } } },
      ],
    });

    const fixture = TestBed.createComponent(ContractsComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it("opens already filtered to what runs out this month", () => {
    const component = buildWith({ status: "expiring" });
    expect(component.contractStatusFilter()).toBe("expiring");
  });

  it("opens already filtered to what nobody has paid for", () => {
    const component = buildWith({ payment: "unpaid" });
    expect(component.paymentFilter()).toBe("unpaid");
    expect(component.filterChips().length).toBe(1);
  });

  it("ignores a payment value it does not recognise", () => {
    const component = buildWith({ payment: "later" });
    expect(component.paymentFilter()).toBe("");
  });
});

