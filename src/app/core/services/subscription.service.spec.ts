import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_BASE_URL } from "../models/api-config";
import { SubscriptionService } from "./subscription.service";

describe("SubscriptionService", () => {
  let service: SubscriptionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(SubscriptionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("get GETs /subscription", () => {
    service.get().subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/subscription`);
    expect(req.request.method).toBe("GET");
    req.flush({});
  });

  it("requestUpgrade POSTs the billing period", () => {
    service.requestUpgrade("yearly").subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/subscription/request_upgrade`);
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({ period: "yearly" });
    req.flush({});
  });

  it("cancelUpgradeRequest DELETEs the pending request", () => {
    service.cancelUpgradeRequest().subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/subscription/request_upgrade`);
    expect(req.request.method).toBe("DELETE");
    req.flush({});
  });
});
