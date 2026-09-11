import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { ConfigurationService } from "../configuration/configuration.service";
import { API_BASE_URL } from "../models/api-config";
import { OnboardingService } from "./onboarding.service";

describe("OnboardingService", () => {
  let service: OnboardingService;
  let httpMock: HttpTestingController;
  let configStub: jasmine.SpyObj<ConfigurationService>;

  beforeEach(() => {
    configStub = jasmine.createSpyObj<ConfigurationService>("ConfigurationService", ["load"]);
    configStub.load.and.returnValue({ subscribe: (o: { error?: () => void }) => o } as never);

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: ConfigurationService, useValue: configStub }],
    });
    service = TestBed.inject(OnboardingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("dismiss POSTs and then reloads the bootstrap configuration", () => {
    service.dismiss().subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/onboarding/dismiss`);
    expect(req.request.method).toBe("POST");
    req.flush({ setup: { dismissed: true } });

    expect(configStub.load).toHaveBeenCalled();
  });

  it("swallows a failure while reloading the bootstrap configuration", () => {
    configStub.load.and.returnValue({ subscribe: (o: { error?: () => void }) => o.error?.() } as never);
    expect(() => {
      service.dismiss().subscribe();
      const req = httpMock.expectOne(`${API_BASE_URL}/onboarding/dismiss`);
      req.flush({ setup: { dismissed: true } });
    }).not.toThrow();
  });
});
