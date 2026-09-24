import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_BASE_URL } from "../models/api-config";
import { SuperadminSupportTicketsService } from "./superadmin-support-tickets.service";

describe("SuperadminSupportTicketsService", () => {
  let service: SuperadminSupportTicketsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(SuperadminSupportTicketsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("list GETs without a status param by default", () => {
    service.list().subscribe();
    const req = httpMock.expectOne((r) => r.url === `${API_BASE_URL}/superadmin/support_tickets`);
    expect(req.request.method).toBe("GET");
    expect(req.request.params.has("status")).toBe(false);
    req.flush({ support_tickets: [], meta: {} });
  });

  it("list includes the status param when given", () => {
    service.list("open").subscribe();
    const req = httpMock.expectOne((r) => r.url === `${API_BASE_URL}/superadmin/support_tickets`);
    expect(req.request.params.get("status")).toBe("open");
    req.flush({ support_tickets: [], meta: {} });
  });

  it("resolve PATCHes with no body", () => {
    service.resolve("t1").subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/superadmin/support_tickets/t1/resolve`);
    expect(req.request.method).toBe("PATCH");
    req.flush({ support_ticket: {} });
  });
});
