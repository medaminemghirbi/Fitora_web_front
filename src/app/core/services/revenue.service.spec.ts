import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_BASE_URL } from "../models/api-config";
import { RevenueService } from "./revenue.service";

describe("RevenueService", () => {
  let service: RevenueService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(RevenueService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("get GETs /admin/revenue", () => {
    service.get().subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/admin/revenue`);
    expect(req.request.method).toBe("GET");
    req.flush({ today: 0, this_week: 0, this_month: 0, by_day: [] });
  });
});
