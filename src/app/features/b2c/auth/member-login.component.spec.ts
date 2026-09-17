import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { HttpErrorResponse } from "@angular/common/http";
import { of, throwError } from "rxjs";
import { AuthService } from "../../../core/auth/auth.service";
import { MemberLoginComponent } from "./member-login.component";

describe("MemberLoginComponent", () => {
  let fixture: ComponentFixture<MemberLoginComponent>;
  let component: MemberLoginComponent;
  let router: Router;
  let authStub: {
    login: jasmine.Spy;
    isClient: jasmine.Spy;
    clearSession: jasmine.Spy;
    homeRouteForCurrentUser: jasmine.Spy;
  };

  function build(isClient = true): void {
    TestBed.resetTestingModule();
    authStub = {
      login: jasmine.createSpy("login").and.returnValue(of({ token: "t", user: {} })),
      isClient: jasmine.createSpy("isClient").and.returnValue(isClient),
      clearSession: jasmine.createSpy("clearSession"),
      homeRouteForCurrentUser: jasmine.createSpy().and.returnValue("/member/home"),
    };

    TestBed.configureTestingModule({
      imports: [MemberLoginComponent, TranslateModule.forRoot()],
      providers: [provideRouter([]), { provide: AuthService, useValue: authStub }],
    });

    fixture = TestBed.createComponent(MemberLoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, "navigateByUrl");
    fixture.detectChanges();
    component.form.setValue({ email: "rania@example.com", password: "password123" });
  }

  it("does not call the API with an invalid form", () => {
    build();
    component.form.setValue({ email: "", password: "" });

    component.submit();

    expect(authStub.login).not.toHaveBeenCalled();
  });

  it("signs a member in and sends them to their own home", () => {
    build();

    component.submit();

    expect(authStub.login).toHaveBeenCalledWith("rania@example.com", "password123");
    expect(router.navigateByUrl).toHaveBeenCalledWith("/member/home");
    expect(component.wrongZone()).toBe(false);
  });

  it("refuses a gym account: drops the session and stays put", () => {
    build(false);

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
