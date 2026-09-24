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
    homeRouteForCurrentUser: jasmine.Spy;
  };

  function build(): void {
    TestBed.resetTestingModule();
    authStub = {
      login: jasmine.createSpy("login").and.returnValue(of({ token: "t", user: {} })),
      homeRouteForCurrentUser: jasmine.createSpy().and.returnValue("/admin/dashboard"),
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
    expect(router.navigateByUrl).toHaveBeenCalledWith("/admin/dashboard");
  });

  it("shows the backend's message when the credentials are wrong", () => {
    build();
    authStub.login.and.returnValue(throwError(() => new HttpErrorResponse({ error: { error: "Invalid email or password" } })));

    component.submit();

    expect(component.error()).toBe("Invalid email or password");
    expect(component.loading()).toBe(false);
  });
});
