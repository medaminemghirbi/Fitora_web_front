import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { HttpErrorResponse } from "@angular/common/http";
import { of, throwError } from "rxjs";
import { AuthService } from "../../../core/auth/auth.service";
import { ProLoginComponent } from "./pro-login.component";

describe("ProLoginComponent", () => {
  let fixture: ComponentFixture<ProLoginComponent>;
  let component: ProLoginComponent;
  let router: Router;
  let authStub: {
    login: jasmine.Spy;
    isClient: jasmine.Spy;
    clearSession: jasmine.Spy;
    homeRouteForCurrentUser: jasmine.Spy;
  };

  function build(isClient = false): void {
    TestBed.resetTestingModule();
    authStub = {
      login: jasmine.createSpy("login").and.returnValue(of({ token: "t", user: {} })),
      isClient: jasmine.createSpy("isClient").and.returnValue(isClient),
      clearSession: jasmine.createSpy("clearSession"),
      homeRouteForCurrentUser: jasmine.createSpy().and.returnValue("/owner/dashboard"),
    };

    TestBed.configureTestingModule({
      imports: [ProLoginComponent, TranslateModule.forRoot()],
      providers: [provideRouter([]), { provide: AuthService, useValue: authStub }],
    });

    fixture = TestBed.createComponent(ProLoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, "navigateByUrl");
    fixture.detectChanges();
    component.form.setValue({ email: "owner@example.com", password: "password123" });
  }

  it("does not call the API with an invalid form", () => {
    build();
    component.form.setValue({ email: "", password: "" });

    component.submit();

    expect(authStub.login).not.toHaveBeenCalled();
  });

  it("signs a gym login in and sends it to its own home", () => {
    build();

    component.submit();

    expect(authStub.login).toHaveBeenCalledWith("owner@example.com", "password123");
    expect(router.navigateByUrl).toHaveBeenCalledWith("/owner/dashboard");
    expect(component.wrongZone()).toBe(false);
  });

  it("refuses a member account: drops the session and stays put", () => {
    build(true);

    component.submit();

    expect(authStub.clearSession).toHaveBeenCalled();
    expect(component.wrongZone()).toBe(true);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it("shows the backend's message when the credentials are wrong", () => {
    build();
    authStub.login.and.returnValue(throwError(() => new HttpErrorResponse({ error: { error: "Invalid email or password" } })));

    component.submit();

    expect(component.error()).toBe("Invalid email or password");
    expect(component.loading()).toBe(false);
  });
});
