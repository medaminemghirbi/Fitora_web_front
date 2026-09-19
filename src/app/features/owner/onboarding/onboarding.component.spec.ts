import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { AuthService } from "../../../core/auth/auth.service";
import { ConfigurationService } from "../../../core/configuration/configuration.service";
import { OnboardingState } from "../../../core/models/onboarding.model";
import { OnboardingService } from "../../../core/services/onboarding.service";
import { ToastService } from "../../../core/services/toast.service";
import { OnboardingComponent } from "./onboarding.component";

function state(overrides: Partial<OnboardingState> = {}): OnboardingState {
  return {
    step: "company",
    complete: false,
    dismissed: false,
    done_count: 0,
    total: 4,
    steps: [
      { key: "company", skippable: false, state: "current", count: null },
      { key: "activities", skippable: false, state: "todo", count: 0 },
      { key: "plans", skippable: false, state: "todo", count: 0 },
      { key: "staff", skippable: true, state: "todo", count: 0 },
    ],
    ...overrides,
  };
}

describe("OnboardingComponent", () => {
  let fixture: ComponentFixture<OnboardingComponent>;
  let component: OnboardingComponent;
  let onboarding: jasmine.SpyObj<OnboardingService>;
  let toast: jasmine.SpyObj<ToastService>;
  let router: Router;

  function build(current: OnboardingState | null = state()): void {
    TestBed.resetTestingModule();

    onboarding = jasmine.createSpyObj<OnboardingService>("OnboardingService", ["load", "complete", "skip", "dismiss", "state"]);
    onboarding.state.and.returnValue(current);
    onboarding.load.and.returnValue(of({ onboarding: current as OnboardingState }));
    onboarding.complete.and.returnValue(of({ onboarding: current as OnboardingState }));
    onboarding.skip.and.returnValue(of({ onboarding: current as OnboardingState }));
    onboarding.dismiss.and.returnValue(of({ onboarding: current as OnboardingState }));
    toast = jasmine.createSpyObj<ToastService>("ToastService", ["success", "error"]);

    TestBed.configureTestingModule({
      imports: [OnboardingComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: OnboardingService, useValue: onboarding },
        { provide: ToastService, useValue: toast },
        { provide: AuthService, useValue: { currentUser: () => ({ first_name: "Amine", role: "owner" }) } },
        {
          provide: ConfigurationService,
          useValue: {
            company: () => ({ name: "Studio", currency: "TND", timezone: "Africa/Tunis", business_hours_start: "07:00", business_hours_end: "21:00" }),
          },
        },
      ],
    });

    fixture = TestBed.createComponent(OnboardingComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  }

  it("re-reads the flow on open rather than trusting the page it came from", () => {
    build();
    expect(onboarding.load).toHaveBeenCalled();
  });

  it("shows the company panel first, with the values to check", () => {
    build();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain("Studio");
    expect(text).toContain("Africa/Tunis");
  });

  it("confirms the company step — the one nothing in the data can confirm", () => {
    build();
    component.confirmCompany();

    expect(onboarding.complete).toHaveBeenCalledWith("company");
  });

  it("skips a step and reports a refusal rather than swallowing it", () => {
    build();
    onboarding.skip.and.returnValue(throwError(() => new Error("no")));

    component.skip("staff");

    expect(toast.error).toHaveBeenCalled();
    expect(component.working()).toBe(false);
  });

  it("leaving the flow goes to the dashboard", () => {
    build();
    const navigate = spyOn(router, "navigateByUrl");

    component.leave();

    expect(onboarding.dismiss).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith("/owner/dashboard");
  });

  it("stays put and says so when leaving fails", () => {
    build();
    onboarding.dismiss.and.returnValue(throwError(() => new Error("no")));
    const navigate = spyOn(router, "navigateByUrl");

    component.leave();

    expect(navigate).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
  });

  it("shows the done panel instead of a step once everything is settled", () => {
    build(state({ complete: true, step: "done", done_count: 4 }));

    expect(fixture.nativeElement.querySelector(".ob-done")).not.toBeNull();
    expect(fixture.nativeElement.querySelector(".ob-leave")).toBeNull();
  });

  it("stops loading even when the flow cannot be read", () => {
    TestBed.resetTestingModule();
    build();
    onboarding.load.and.returnValue(throwError(() => new Error("no")));

    component.ngOnInit();

    expect(component.loading()).toBe(false);
  });
});
