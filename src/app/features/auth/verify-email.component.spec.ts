import { HttpErrorResponse } from "@angular/common/http";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, convertToParamMap } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { AccountRecoveryService } from "../../core/auth/account-recovery.service";
import { AuthService } from "../../core/auth/auth.service";
import { VerifyEmailComponent } from "./verify-email.component";

describe("VerifyEmailComponent", () => {
  let fixture: ComponentFixture<VerifyEmailComponent>;
  let component: VerifyEmailComponent;
  let recovery: jasmine.SpyObj<AccountRecoveryService>;
  let authStub: { isAuthenticated: jasmine.Spy; homeRouteForCurrentUser: jasmine.Spy; refreshCurrentUser: jasmine.Spy };

  function build(token: string | null): void {
    recovery = jasmine.createSpyObj<AccountRecoveryService>("AccountRecoveryService", ["verifyEmail"]);
    authStub = {
      isAuthenticated: jasmine.createSpy().and.returnValue(false),
      homeRouteForCurrentUser: jasmine.createSpy().and.returnValue("/owner/dashboard"),
      refreshCurrentUser: jasmine.createSpy().and.returnValue(of(undefined)),
    };

    TestBed.configureTestingModule({
      imports: [VerifyEmailComponent, TranslateModule.forRoot()],
      providers: [
        { provide: AccountRecoveryService, useValue: recovery },
        { provide: AuthService, useValue: authStub },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(token ? { token } : {}) } },
        },
      ],
    });

    fixture = TestBed.createComponent(VerifyEmailComponent);
    component = fixture.componentInstance;
  }

  it("errors immediately when there is no token", () => {
    build(null);
    fixture.detectChanges();
    expect(component.status()).toBe("error");
    expect(component.error()).toBe("auth.verify_email_invalid_link");
    expect(recovery.verifyEmail).not.toHaveBeenCalled();
  });

  it("verifies the token and shows success", () => {
    build("tok123");
    recovery.verifyEmail.and.returnValue(of(undefined));
    fixture.detectChanges();
    expect(recovery.verifyEmail).toHaveBeenCalledWith("tok123");
    expect(component.status()).toBe("success");
  });

  it("shows the invalid-link error when verification fails", () => {
    build("tok123");
    recovery.verifyEmail.and.returnValue(throwError(() => new HttpErrorResponse({ status: 422 })));
    fixture.detectChanges();
    expect(component.status()).toBe("error");
    expect(component.error()).toBe("auth.verify_email_invalid_link");
  });

  it("continueUrl sends a signed-in user to their home route", () => {
    build("tok123");
    recovery.verifyEmail.and.returnValue(of(undefined));
    authStub.isAuthenticated.and.returnValue(true);
    fixture.detectChanges();
    expect(component.continueUrl()).toBe("/owner/dashboard");
  });

  it("continueUrl sends a signed-out visitor to login", () => {
    build("tok123");
    recovery.verifyEmail.and.returnValue(of(undefined));
    fixture.detectChanges();
    expect(component.continueUrl()).toBe("/auth/login");
  });

  it("refreshes the cached current user after verifying, when already signed in", () => {
    build("tok123");
    recovery.verifyEmail.and.returnValue(of(undefined));
    authStub.isAuthenticated.and.returnValue(true);
    fixture.detectChanges();
    expect(authStub.refreshCurrentUser).toHaveBeenCalled();
  });

  it("does not try to refresh the current user for a signed-out visitor", () => {
    build("tok123");
    recovery.verifyEmail.and.returnValue(of(undefined));
    fixture.detectChanges();
    expect(authStub.refreshCurrentUser).not.toHaveBeenCalled();
  });
});
