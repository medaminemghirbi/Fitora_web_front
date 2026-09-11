import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_BASE_URL } from "../models/api-config";
import { PaymentsService } from "./payments.service";

describe("PaymentsService", () => {
  let service: PaymentsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(PaymentsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("list GETs with no params by default", () => {
    service.list().subscribe();
    const req = httpMock.expectOne((r) => r.url === `${API_BASE_URL}/payments`);
    expect(req.request.params.keys().length).toBe(0);
    req.flush({ payments: [], meta: {} });
  });

  it("list forwards non-blank filters", () => {
    service.list({ status: "paid", payment_method: "cash", date: "2026-01-01", q: "amy", page: 2 }).subscribe();
    const req = httpMock.expectOne((r) => r.url === `${API_BASE_URL}/payments`);
    expect(req.request.params.get("status")).toBe("paid");
    expect(req.request.params.get("payment_method")).toBe("cash");
    expect(req.request.params.get("page")).toBe("2");
    req.flush({ payments: [], meta: {} });
  });

  it("get GETs a single payment", () => {
    service.get("p1").subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/payments/p1`);
    expect(req.request.method).toBe("GET");
    req.flush({ payment: {} });
  });

  it("record POSTs the raw payload", () => {
    const payload = { client_id: "c1", payment_method: "cash" as const };
    service.record(payload).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/payments`);
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual(payload);
    req.flush({ payment: {} });
  });

  it("refund POSTs to /payments/:id/refund", () => {
    service.refund("p1").subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/payments/p1/refund`);
    expect(req.request.method).toBe("POST");
    req.flush({ payment: {} });
  });
});
