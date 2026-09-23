import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_BASE_URL } from "../models/api-config";
import { AdminCompaniesService } from "./admin-companies.service";

describe("AdminCompaniesService", () => {
  let service: AdminCompaniesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AdminCompaniesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("list GETs with page param", () => {
    service.list(2).subscribe();
    const req = httpMock.expectOne((r) => r.url === `${API_BASE_URL}/admin/companies`);
    expect(req.request.method).toBe("GET");
    expect(req.request.params.get("page")).toBe("2");
    expect(req.request.params.has("q")).toBe(false);
    req.flush({ companies: [], meta: {} });
  });

  it("list defaults to page 1 when omitted", () => {
    service.list().subscribe();
    const req = httpMock.expectOne((r) => r.url === `${API_BASE_URL}/admin/companies`);
    expect(req.request.params.get("page")).toBe("1");
    req.flush({ companies: [], meta: {} });
  });

  it("list includes q when given", () => {
    service.list(1, "acme").subscribe();
    const req = httpMock.expectOne((r) => r.url === `${API_BASE_URL}/admin/companies`);
    expect(req.request.params.get("q")).toBe("acme");
    req.flush({ companies: [], meta: {} });
  });

  it("get GETs a single company", () => {
    service.get("co1").subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/admin/companies/co1`);
    expect(req.request.method).toBe("GET");
    req.flush({ company: {}, currency_options: [], locale_options: [] });
  });

  it("updateSubscription PATCHes the subscription payload", () => {
    service.updateSubscription("co1", { active: false }).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/admin/companies/co1/subscription`);
    expect(req.request.method).toBe("PATCH");
    expect(req.request.body).toEqual({ active: false });
    req.flush({ company: {} });
  });

  it("updateSettings PATCHes a wrapped payload", () => {
    service.updateSettings("co1", { currency: "USD" }).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/admin/companies/co1/settings`);
    expect(req.request.method).toBe("PATCH");
    expect(req.request.body).toEqual({ company: { currency: "USD" } });
    req.flush({ company: {} });
  });

  it("issues an invoice when the money arrives", () => {
    service.issueInvoice("co1").subscribe();

    const req = httpMock.expectOne(`${API_BASE_URL}/admin/companies/co1/invoices`);
    expect(req.request.method).toBe("POST");
    req.flush({ invoice: {}, company: {} });
  });

  it("voids one issued in error", () => {
    service.voidInvoice("co1", "inv1").subscribe();

    const req = httpMock.expectOne(`${API_BASE_URL}/admin/companies/co1/invoices/inv1`);
    expect(req.request.method).toBe("DELETE");
    req.flush({ company: {} });
  });

  it("impersonate POSTs with no body", () => {
    service.impersonate("co1").subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/admin/companies/co1/impersonate`);
    expect(req.request.method).toBe("POST");
    req.flush({ token: "t", user: {} });
  });
});
