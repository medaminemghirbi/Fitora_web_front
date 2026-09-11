import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_BASE_URL } from "../models/api-config";
import { RolesService } from "./roles.service";

describe("RolesService", () => {
  let service: RolesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(RolesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("list GETs /roles", () => {
    service.list().subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/roles`);
    expect(req.request.method).toBe("GET");
    req.flush({ roles: [], permission_catalog: {} });
  });

  it("create POSTs a wrapped payload", () => {
    service.create({ name: "Accountant", permissions: ["payments"] }).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/roles`);
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({ role: { name: "Accountant", permissions: ["payments"] } });
    req.flush({ role: {} });
  });

  it("update PATCHes a wrapped payload", () => {
    service.update("r1", { permissions: ["reports"] }).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/roles/r1`);
    expect(req.request.method).toBe("PATCH");
    expect(req.request.body).toEqual({ role: { permissions: ["reports"] } });
    req.flush({ role: {} });
  });

  it("delete DELETEs the role", () => {
    service.delete("r1").subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/roles/r1`);
    expect(req.request.method).toBe("DELETE");
    req.flush(null);
  });
});
