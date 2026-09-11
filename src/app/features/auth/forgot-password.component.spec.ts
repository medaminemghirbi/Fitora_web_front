import { HttpErrorResponse } from "@angular/common/http";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { AccountRecoveryService } from "../../core/auth/account-recovery.service";
import { ForgotPasswordComponent } from "./forgot-password.component";

describe("ForgotPasswordComponent", () => {
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let component: ForgotPasswordComponent;
  let recovery: jasmine.SpyObj<AccountRecoveryService>;

  beforeEach(async () => {
    recovery = jasmine.createSpyObj<AccountRecoveryService>("AccountRecoveryService", ["requestPasswordReset"]);

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent, TranslateModule.forRoot()],
      providers: [provideRouter([]), { provide: AccountRecoveryService, useValue: recovery }],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("does not submit an invalid form", () => {
    component.submit();
    expect(recovery.requestPasswordReset).not.toHaveBeenCalled();
    expect(component.form.get("email")!.touched).toBe(true);
  });

  it("requests a reset and shows the sent state on success", () => {
    recovery.requestPasswordReset.and.returnValue(of(undefined));
    component.form.setValue({ email: "s@x.test" });

    component.submit();

    expect(recovery.requestPasswordReset).toHaveBeenCalledWith("s@x.test");
    expect(component.sent()).toBe(true);
    expect(component.loading()).toBe(false);
  });

  it("shows a rate-limit message for the rate_limited error code", () => {
    recovery.requestPasswordReset.and.returnValue(throwError(() => new HttpErrorResponse({ error: { error: "rate_limited" } })));
    component.form.setValue({ email: "s@x.test" });

    component.submit();

    expect(component.error()).toBe("auth.too_many_attempts");
    expect(component.loading()).toBe(false);
  });

  it("shows a generic error message for anything else", () => {
    recovery.requestPasswordReset.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    component.form.setValue({ email: "s@x.test" });

    component.submit();

    expect(component.error()).toBe("common.error_generic");
  });
});
