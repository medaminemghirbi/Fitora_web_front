import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { AccountRecoveryService } from "../../core/auth/account-recovery.service";
import { AuthService } from "../../core/auth/auth.service";
import { ConfigurationService } from "../../core/configuration/configuration.service";
import { AppVersionService } from "../../core/services/app-version.service";
import { BrandingService } from "../../core/services/branding.service";
import { OwnerShellComponent } from "./owner-shell.component";

describe("OwnerShellComponent", () => {
  let fixture: ComponentFixture<OwnerShellComponent>;
  let component: OwnerShellComponent;
  let authStub: {
    currentUser: jasmine.Spy;
    isImpersonating: jasmine.Spy;
    impersonatedCompanyName: jasmine.Spy;
    exitImpersonation: jasmine.Spy;
    loadConfiguration: jasmine.Spy;
    hasPermission: jasmine.Spy;
  };
  let configStub: jasmine.SpyObj<ConfigurationService>;
  let recoveryStub: jasmine.SpyObj<AccountRecoveryService>;

  function build(currentUser: unknown, ready = true, version: string | null = null): void {
    authStub = {
      currentUser: jasmine.createSpy().and.returnValue(currentUser),
      isImpersonating: jasmine.createSpy().and.returnValue(false),
      impersonatedCompanyName: jasmine.createSpy().and.returnValue(null),
      exitImpersonation: jasmine.createSpy(),
      loadConfiguration: jasmine.createSpy(),
      hasPermission: jasmine.createSpy().and.returnValue(true),
    };
    configStub = jasmine.createSpyObj<ConfigurationService>("ConfigurationService", ["ready", "subscription"]);
    configStub.ready.and.returnValue(ready);
    configStub.subscription.and.returnValue(null);
    recoveryStub = jasmine.createSpyObj<AccountRecoveryService>("AccountRecoveryService", ["resendVerification"]);

    TestBed.configureTestingModule({
      imports: [OwnerShellComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authStub },
        { provide: ConfigurationService, useValue: configStub },
        { provide: AccountRecoveryService, useValue: recoveryStub },
        { provide: BrandingService, useValue: jasmine.createSpyObj<BrandingService>("BrandingService", ["logoUrl", "load"]) },
        { provide: AppVersionService, useValue: { current: () => version, load: jasmine.createSpy() } },
      ],
    });
  }

  const owner = { role: "owner", email_verified: true };

  it("triggers loadConfiguration when the bootstrap hasn't resolved yet", () => {
    build(owner, false);
    fixture = TestBed.createComponent(OwnerShellComponent);
    fixture.detectChanges();
    expect(authStub.loadConfiguration).toHaveBeenCalled();
  });

  it("does not reload configuration once it's already ready", () => {
    build(owner, true);
    fixture = TestBed.createComponent(OwnerShellComponent);
    fixture.detectChanges();
    expect(authStub.loadConfiguration).not.toHaveBeenCalled();
  });

  describe("once constructed", () => {
    beforeEach(() => {
      build(owner, true);
      fixture = TestBed.createComponent(OwnerShellComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it("showOwnerOnlySections is true for an owner", () => {
      expect(component.showOwnerOnlySections()).toBe(true);
    });

    it("emailUnverified reflects the current user's verification state", () => {
      expect(component.emailUnverified()).toBe(false);
    });

    it("trialDaysRemaining is null with no subscription", () => {
      expect(component.trialDaysRemaining()).toBeNull();
    });

    it("resendVerificationEmail flips the loading/success flags on success", () => {
      recoveryStub.resendVerification.and.returnValue(of({}) as never);
      component.resendVerificationEmail();
      expect(component.resendingVerification()).toBe(false);
      expect(component.verificationResent()).toBe(true);
    });

    it("resendVerificationEmail clears the loading flag on error", () => {
      recoveryStub.resendVerification.and.returnValue(throwError(() => new Error("nope")));
      component.resendVerificationEmail();
      expect(component.resendingVerification()).toBe(false);
      expect(component.verificationResent()).toBe(false);
    });
  });

  it("showOwnerOnlySections is false for a staff login", () => {
    build({ role: "staff", email_verified: true }, true);
    fixture = TestBed.createComponent(OwnerShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.showOwnerOnlySections()).toBe(false);
  });

  it("trialDaysRemaining surfaces the countdown while on trial", () => {
    build(owner, true);
    configStub.subscription.and.returnValue({ status: "trial", locked: false, on_trial: true, trial_days_remaining: 5 });
    fixture = TestBed.createComponent(OwnerShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.trialDaysRemaining()).toBe(5);
  });

  it("trialDaysRemaining is null while on trial with no day count yet", () => {
    build(owner, true);
    configStub.subscription.and.returnValue({ status: "trial", locked: false, on_trial: true, trial_days_remaining: null });
    fixture = TestBed.createComponent(OwnerShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.trialDaysRemaining()).toBeNull();
  });

  it("versionSuffix is null with no app version loaded yet", () => {
    build(owner, true);
    fixture = TestBed.createComponent(OwnerShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.versionSuffix()).toBeNull();
  });

  it("versionSuffix formats the loaded app version", () => {
    build(owner, true, "1.2.3");
    fixture = TestBed.createComponent(OwnerShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.versionSuffix()).toBe("v1.2.3");
  });
});
