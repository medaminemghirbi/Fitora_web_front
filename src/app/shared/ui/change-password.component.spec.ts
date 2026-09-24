import { HttpErrorResponse } from "@angular/common/http";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { AuthService } from "../../core/auth/auth.service";
import { ConfirmService } from "../../core/services/confirm.service";
import { ToastService } from "../../core/services/toast.service";
import { ChangePasswordComponent } from "./change-password.component";

describe("ChangePasswordComponent", () => {
  let fixture: ComponentFixture<ChangePasswordComponent>;
  let component: ChangePasswordComponent;
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthService>("AuthService", ["changePassword", "signOutEverywhere"]);
    TestBed.configureTestingModule({
      imports: [ChangePasswordComponent, TranslateModule.forRoot()],
      providers: [{ provide: AuthService, useValue: auth }],
    });
    fixture = TestBed.createComponent(ChangePasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function fill(password = "new-password-1", confirmation = password): void {
    component.form.setValue({ current_password: "old-password", password, password_confirmation: confirmation });
  }

  it("changes the password and clears the form", () => {
    auth.changePassword.and.returnValue(of(undefined));
    fill();

    component.submit();

    expect(auth.changePassword).toHaveBeenCalledWith("old-password", "new-password-1");
    expect(component.form.getRawValue().password).toBe("");
    expect(TestBed.inject(ToastService).toasts()[0].kind).toBe("success");
  });

  it("does not send two passwords that differ", () => {
    fill("new-password-1", "new-password-2");
    component.submit();
    expect(auth.changePassword).not.toHaveBeenCalled();
  });

  it("does not send one shorter than 8 characters", () => {
    fill("short");
    component.submit();
    expect(auth.changePassword).not.toHaveBeenCalled();
  });

  it("says so when the current password is wrong", () => {
    auth.changePassword.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 422, error: { error: "current_password_invalid" } }))
    );
    fill();

    component.submit();

    expect(component.error()).toBe("account.current_password_wrong");
    expect(component.saving()).toBe(false);
  });

  it("signs out everywhere after a confirmation", async () => {
    spyOn(TestBed.inject(ConfirmService), "ask").and.resolveTo(true);
    auth.signOutEverywhere.and.returnValue(of(undefined));

    await component.signOutEverywhere();

    expect(auth.signOutEverywhere).toHaveBeenCalled();
  });
});
