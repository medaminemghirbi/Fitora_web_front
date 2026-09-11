import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_BASE_URL } from "../models/api-config";
import { CompanyService } from "./company.service";

describe("CompanyService", () => {
  let service: CompanyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(CompanyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("get GETs /company", () => {
    service.get().subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/company`);
    expect(req.request.method).toBe("GET");
    req.flush({ company: {} });
  });

  it("create POSTs a wrapped payload", () => {
    service.create({ name: "Acme" }).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/company`);
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({ company: { name: "Acme" } });
    req.flush({ company: {} });
  });

  it("update PATCHes a wrapped payload", () => {
    service.update({ name: "Acme 2" }).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/company`);
    expect(req.request.method).toBe("PATCH");
    expect(req.request.body).toEqual({ company: { name: "Acme 2" } });
    req.flush({ company: {} });
  });

  it("updateBranding PATCHes multipart form data, skipping nullish fields", () => {
    service.updateBranding({ slug: "acme", primary_color: null }).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/company`);
    expect(req.request.method).toBe("PATCH");
    const body = req.request.body as FormData;
    expect(body instanceof FormData).toBe(true);
    expect(body.get("company[slug]")).toBe("acme");
    expect(body.has("company[primary_color]")).toBe(false);
    req.flush({ company: {} });
  });

  it("regenerateMobileKey POSTs with no body", () => {
    service.regenerateMobileKey().subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/company/regenerate_mobile_key`);
    expect(req.request.method).toBe("POST");
    req.flush({ company: {} });
  });

  it("getMobileKeyQr GETs a blob", () => {
    service.getMobileKeyQr().subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/company/mobile_key_qr`);
    expect(req.request.method).toBe("GET");
    expect(req.request.responseType).toBe("blob");
    req.flush(new Blob());
  });
});
