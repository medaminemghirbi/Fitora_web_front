import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_BASE_URL } from "../models/api-config";
import { AuditLogsService } from "./audit-logs.service";

describe("AuditLogsService", () => {
  let service: AuditLogsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AuditLogsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("list GETs with default page/per_page", () => {
    service.list().subscribe();
    const req = httpMock.expectOne((r) => r.url === `${API_BASE_URL}/audit_logs`);
    expect(req.request.method).toBe("GET");
    expect(req.request.params.get("page")).toBe("1");
    expect(req.request.params.get("per_page")).toBe("5");
    req.flush({ audit_logs: [], meta: {} });
  });

  it("list GETs with the given page/per_page", () => {
    service.list(3, 20).subscribe();
    const req = httpMock.expectOne((r) => r.url === `${API_BASE_URL}/audit_logs`);
    expect(req.request.params.get("page")).toBe("3");
    expect(req.request.params.get("per_page")).toBe("20");
    req.flush({ audit_logs: [], meta: {} });
  });
});
