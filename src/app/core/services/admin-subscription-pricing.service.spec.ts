import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_BASE_URL } from "../models/api-config";
import { AdminSubscriptionPricingService } from "./admin-subscription-pricing.service";

describe("AdminSubscriptionPricingService", () => {
  let service: AdminSubscriptionPricingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AdminSubscriptionPricingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("get GETs without a currency param by default", () => {
    service.get().subscribe();
    const req = httpMock.expectOne((r) => r.url === `${API_BASE_URL}/admin/subscription_pricing`);
    expect(req.request.method).toBe("GET");
    expect(req.request.params.has("currency")).toBe(false);
    req.flush({});
  });

  it("get includes the currency param when given", () => {
    service.get("USD").subscribe();
    const req = httpMock.expectOne((r) => r.url === `${API_BASE_URL}/admin/subscription_pricing`);
    expect(req.request.params.get("currency")).toBe("USD");
    req.flush({});
  });

  it("update PATCHes the payload", () => {
    service.update({ monthly_cents: 1000 }).subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/admin/subscription_pricing`);
    expect(req.request.method).toBe("PATCH");
    expect(req.request.body).toEqual({ monthly_cents: 1000 });
    req.flush({});
  });
});
