import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_BASE_URL } from "../models/api-config";
import { ReportsService } from "./reports.service";

describe("ReportsService", () => {
  let service: ReportsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ReportsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("exportCompany GETs a blob with period_type/period params", () => {
    service.exportCompany("month", "2026-01").subscribe();
    const req = httpMock.expectOne((r) => r.url === `${API_BASE_URL}/admin/reports/export`);
    expect(req.request.params.get("period_type")).toBe("month");
    expect(req.request.params.get("period")).toBe("2026-01");
    expect(req.request.responseType).toBe("blob");
    req.flush(new Blob());
  });
});
