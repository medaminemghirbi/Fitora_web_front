import { ComponentFixture, TestBed, fakeAsync, tick } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { AuthService } from "../../../core/auth/auth.service";
import { ConfigurationService, SetupState } from "../../../core/configuration/configuration.service";
import { OnboardingService } from "../../../core/services/onboarding.service";
import { GettingStartedComponent } from "./getting-started.component";

describe("GettingStartedComponent", () => {
  let fixture: ComponentFixture<GettingStartedComponent>;
  let component: GettingStartedComponent;
  let onboarding: jasmine.SpyObj<OnboardingService>;
  let configStub: { setup: jasmine.Spy };
  let router: Router;

  function build(setup: SetupState | null): void {
    TestBed.resetTestingModule();
    onboarding = jasmine.createSpyObj<OnboardingService>("OnboardingService", ["dismiss"]);
    configStub = { setup: jasmine.createSpy().and.returnValue(setup) };

    TestBed.configureTestingModule({
      imports: [GettingStartedComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: OnboardingService, useValue: onboarding },
        { provide: ConfigurationService, useValue: configStub },
        { provide: AuthService, useValue: { currentUser: () => ({}) } },
      ],
    });

    fixture = TestBed.createComponent(GettingStartedComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, "navigateByUrl");
    fixture.detectChanges();
  }

  it("stays put while setup is incomplete and not dismissed", () => {
    build({ activity: false, contract_type: false, coach: false, work_contract: false, dismissed: false, complete: false });
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it("redirects to the dashboard once setup is complete", fakeAsync(() => {
    build({ activity: true, contract_type: true, coach: true, work_contract: true, dismissed: false, complete: true });
    tick();
    expect(router.navigateByUrl).toHaveBeenCalledWith("/owner/dashboard");
  }));

  it("redirects to the dashboard once dismissed", fakeAsync(() => {
    build({ activity: false, contract_type: false, coach: false, work_contract: false, dismissed: true, complete: false });
    tick();
    expect(router.navigateByUrl).toHaveBeenCalledWith("/owner/dashboard");
  }));

  it("skip dismisses the guide and navigates to the dashboard", () => {
    build(null);
    onboarding.dismiss.and.returnValue(of({ setup: {} as SetupState }));
    component.skip();
    // dismissing() is never reset on success — the page navigates away.
    expect(component.dismissing()).toBe(true);
    expect(router.navigateByUrl).toHaveBeenCalledWith("/owner/dashboard");
  });

  it("skip resets the dismissing flag on failure", () => {
    build(null);
    onboarding.dismiss.and.returnValue(throwError(() => new Error("nope")));
    component.skip();
    expect(component.dismissing()).toBe(false);
  });

  it("goToDashboard navigates directly", () => {
    build(null);
    component.goToDashboard();
    expect(router.navigateByUrl).toHaveBeenCalledWith("/owner/dashboard");
  });
});
