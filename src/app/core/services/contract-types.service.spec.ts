import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_BASE_URL } from "../models/api-config";
import { ContractTypesService } from "./contract-types.service";

describe("ContractTypesService", () => {
  let service: ContractTypesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ContractTypesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("list GETs /contract_types", () => {
    service.list().subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/contract_types`);
    expect(req.request.method).toBe("GET");
    req.flush({ plans: [] });
  });

  it("get GETs a single plan", () => {
    service.get("ct1").subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/contract_types/ct1`);
    expect(req.request.method).toBe("GET");
    req.flush({ plan: {} });
  });

  it("create separates activity_ids from the wrapped plan fields", () => {
    service.create({ name: "Basic", activity_ids: ["a1", "a2"] }).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/contract_types`);
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({ contract_type: { name: "Basic" }, activity_ids: ["a1", "a2"] });
    req.flush({ plan: {} });
  });

  it("update separates activity_ids from the wrapped plan fields", () => {
    service.update("ct1", { price: 100, activity_ids: ["a1"] }).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/contract_types/ct1`);
    expect(req.request.method).toBe("PATCH");
    expect(req.request.body).toEqual({ contract_type: { price: 100 }, activity_ids: ["a1"] });
    req.flush({ plan: {} });
  });
});
