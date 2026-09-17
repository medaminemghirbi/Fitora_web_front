import { HttpErrorResponse } from "@angular/common/http";
import { ComponentFixture, TestBed, fakeAsync, tick } from "@angular/core/testing";
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { AccountRecoveryService } from "../../core/auth/account-recovery.service";
import { ResetPasswordComponent } from "./reset-password.component";

describe("ResetPasswordComponent", () => {
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let component: ResetPasswordComponent;
  let recovery: jasmine.SpyObj<AccountRecoveryService>;
  let router: Router;

  function build(token: string | null): void {
    recovery = jasmine.createSpyObj<AccountRecoveryService>("AccountRecoveryService", ["resetPassword"]);

    TestBed.configureTestingModule({
      imports: [ResetPasswordComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: AccountRecoveryService, useValue: recovery },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(token ? { token } : {}) } },
        },
      ],
    });

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, "navigateByUrl");
    fixture.detectChanges();
  }

  it("shows an invalid-link error when there is no token", () => {
    build(null);
    expect(component.error()).toBe("auth.reset_password_invalid_link");
  });

  it("does not submit an invalid form even with a token", () => {
    build("tok123");
    component.submit();
    expect(recovery.resetPassword).not.toHaveBeenCalled();
  });

  it("flags a mismatch between password and confirmation", () => {
    build("tok123");
    component.form.setValue({ password: "secret123", password_confirmation: "other456" });
    expect(component.form.errors).toEqual({ mismatch: true });
  });

  it("resets the password and redirects to login after a short delay", fakeAsync(() => {
    build("tok123");
    recovery.resetPassword.and.returnValue(of(undefined));
    component.form.setValue({ password: "secret123", password_confirmation: "secret123" });

    component.submit();

    expect(recovery.resetPassword).toHaveBeenCalledWith("tok123", "secret123");
    expect(component.done()).toBe(true);
    expect(router.navigateByUrl).not.toHaveBeenCalled();

    tick(2500);
    expect(router.navigateByUrl).toHaveBeenCalledWith("/pro/connexion");
  }));

  it("shows the invalid-link fallback for an expired token", () => {
    build("tok123");
    recovery.resetPassword.and.returnValue(throwError(() => new HttpErrorResponse({ error: { error: "invalid_or_expired_token" } })));
    component.form.setValue({ password: "secret123", password_confirmation: "secret123" });

    component.submit();

    expect(component.error()).toBe("auth.reset_password_invalid_link");
  });

  it("shows the backend's own message for any other error", () => {
    build("tok123");
    recovery.resetPassword.and.returnValue(throwError(() => new HttpErrorResponse({ error: { error: "Password too weak" } })));
    component.form.setValue({ password: "secret123", password_confirmation: "secret123" });

    component.submit();

    expect(component.error()).toBe("Password too weak");
  });
});
