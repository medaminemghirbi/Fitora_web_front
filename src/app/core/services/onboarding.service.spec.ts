import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { ConfigurationService } from "../configuration/configuration.service";
import { API_BASE_URL } from "../models/api-config";
import { OnboardingState } from "../models/onboarding.model";
import { OnboardingService } from "./onboarding.service";

function state(overrides: Partial<OnboardingState> = {}): OnboardingState {
  return {
    step: "company",
    complete: false,
    dismissed: false,
    done_count: 0,
    total: 4,
    steps: [{ key: "company", skippable: false, state: "current", count: null }],
    ...overrides,
  };
}

describe("OnboardingService", () => {
  let service: OnboardingService;
  let httpMock: HttpTestingController;
  const fromBootstrap = signal<OnboardingState | null>(null);

  beforeEach(() => {
    fromBootstrap.set(null);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfigurationService, useValue: { onboarding: fromBootstrap } },
      ],
    });
    service = TestBed.inject(OnboardingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("falls back to the bootstrap payload before anything is fetched", () => {
    expect(service.state()).toBeNull();

    fromBootstrap.set(state({ step: "plans" }));

    expect(service.state()?.step).toBe("plans");
  });

  it("supersedes the bootstrap payload once loaded", () => {
    fromBootstrap.set(state({ step: "company" }));

    service.load().subscribe();
    httpMock.expectOne(`${API_BASE_URL}/onboarding`).flush({ onboarding: state({ step: "staff" }) });

    expect(service.state()?.step).toBe("staff");
  });

  it("marks a step done", () => {
    service.complete("company").subscribe();

    const req = httpMock.expectOne(`${API_BASE_URL}/onboarding`);
    expect(req.request.method).toBe("PATCH");
    expect(req.request.body).toEqual({ step: "company" });
    req.flush({ onboarding: state({ done_count: 1 }) });

    expect(service.state()?.done_count).toBe(1);
  });

  it("skips a step", () => {
    service.skip("staff").subscribe();

    const req = httpMock.expectOne(`${API_BASE_URL}/onboarding/skip`);
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({ step: "staff" });
    req.flush({ onboarding: state() });
  });

  it("dismisses without pretending the steps are done", () => {
    service.dismiss().subscribe();

    const req = httpMock.expectOne(`${API_BASE_URL}/onboarding/dismiss`);
    expect(req.request.method).toBe("POST");
    req.flush({ onboarding: state({ dismissed: true }) });

    expect(service.state()).toEqual(jasmine.objectContaining({ dismissed: true, complete: false }));
  });
});
