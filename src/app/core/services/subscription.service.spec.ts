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

  it("downloads an invoice as the blob the browser saves", () => {
    service.downloadInvoice("inv1").subscribe();

    const req = httpMock.expectOne(`${API_BASE_URL}/invoices/inv1`);
    expect(req.request.method).toBe("GET");
    expect(req.request.responseType).toBe("blob");
    req.flush(new Blob());
  });

  it("no longer offers anything to ask for", () => {
    expect((service as unknown as Record<string, unknown>)["requestUpgrade"]).toBeUndefined();
  });
});
