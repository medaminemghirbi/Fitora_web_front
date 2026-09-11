import { HttpErrorResponse, provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { AuthService } from "../../core/auth/auth.service";
import { LoginComponent } from "./login.component";

describe("LoginComponent", () => {
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authService = jasmine.createSpyObj("AuthService", ["login", "homeRouteForCurrentUser"]);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it("renders the email and password fields", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('input[type="email"]')).toBeTruthy();
    expect(compiled.querySelector('input[type="password"]')).toBeTruthy();
  });

  it("does not call AuthService.login when the form is invalid", () => {
    fixture.componentInstance.submit();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it("logs in and navigates home on success", () => {
    authService.login.and.returnValue(of({ token: "t", user: {} as any }));
    authService.homeRouteForCurrentUser.and.returnValue("/owner/contracts");
    spyOn(router, "navigateByUrl");

    fixture.componentInstance.form.setValue({ email: "owner@fitora.test", password: "password123" });
    fixture.componentInstance.submit();

    expect(authService.login).toHaveBeenCalledWith("owner@fitora.test", "password123");
    expect(router.navigateByUrl).toHaveBeenCalledWith("/owner/contracts");
  });

  it("shows this app's own translated message on invalid credentials, never the backend's raw one", () => {
    // /auth/login's actual response is unlocalized English either way
    // ("Invalid email or password") — this app's own copy is always the
    // right thing to show a French/Arabic user, not that raw string. (No
    // TranslateHttpLoader in this test's TestBed, so TranslateService
    // .instant() returns the key itself rather than real French text —
    // standard ngx-translate unit-test behavior, not what a user sees.)
    authService.login.and.returnValue(
      throwError(() => new HttpErrorResponse({ error: { error: "Invalid email or password" }, status: 401 }))
    );

    fixture.componentInstance.form.setValue({ email: "owner@fitora.test", password: "wrong" });
    fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(fixture.componentInstance.error()).toBe("auth.invalid_credentials");
  });

  it("shows a rate-limit message once the login throttle trips, never the raw 'rate_limited' code", () => {
    authService.login.and.returnValue(throwError(() => new HttpErrorResponse({ error: { error: "rate_limited" }, status: 429 })));

    fixture.componentInstance.form.setValue({ email: "owner@fitora.test", password: "wrong" });
    fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(fixture.componentInstance.error()).toBe("auth.too_many_attempts");
  });
});
