import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_BASE_URL } from "../models/api-config";
import { SuppliersService } from "./suppliers.service";

describe("SuppliersService", () => {
  let service: SuppliersService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(SuppliersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("list GETs without a search param by default", () => {
    service.list().subscribe();
    const req = httpMock.expectOne((r) => r.url === `${API_BASE_URL}/suppliers`);
    expect(req.request.params.has("search")).toBe(false);
    req.flush({ suppliers: [] });
  });

  it("list includes the search param when given", () => {
    service.list("acme").subscribe();
    const req = httpMock.expectOne((r) => r.url === `${API_BASE_URL}/suppliers`);
    expect(req.request.params.get("search")).toBe("acme");
    req.flush({ suppliers: [] });
  });

  it("create POSTs form data under the supplier[] namespace", () => {
    service.create({ name: "Acme Supplies" } as never).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/suppliers`);
    expect(req.request.method).toBe("POST");
    const body = req.request.body as FormData;
    expect(body instanceof FormData).toBe(true);
    expect(body.get("supplier[name]")).toBe("Acme Supplies");
    req.flush({ supplier: {} });
  });

  it("update PATCHes form data under the supplier[] namespace", () => {
    service.update("s1", { name: "Acme 2" }).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/suppliers/s1`);
    expect(req.request.method).toBe("PATCH");
    const body = req.request.body as FormData;
    expect(body.get("supplier[name]")).toBe("Acme 2");
    req.flush({ supplier: {} });
  });

  it("deactivate DELETEs the supplier", () => {
    service.deactivate("s1").subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/suppliers/s1`);
    expect(req.request.method).toBe("DELETE");
    req.flush({ supplier: {} });
  });
});
