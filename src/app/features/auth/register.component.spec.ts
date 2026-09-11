import { HttpErrorResponse } from "@angular/common/http";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { AuthService } from "../../core/auth/auth.service";
import { RegisterComponent } from "./register.component";

describe("RegisterComponent", () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let authStub: { register: jasmine.Spy; homeRouteForCurrentUser: jasmine.Spy };
  let router: Router;

  beforeEach(async () => {
    authStub = {
      register: jasmine.createSpy(),
      homeRouteForCurrentUser: jasmine.createSpy().and.returnValue("/owner/getting-started"),
    };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, TranslateModule.forRoot()],
      providers: [provideRouter([]), { provide: AuthService, useValue: authStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, "navigateByUrl");
    fixture.detectChanges();
  });

  const valid = {
    first_name: "S",
    last_name: "O",
    email: "s@x.test",
    phone: "",
    password: "secret123",
  };

  it("does not submit an invalid form", () => {
    component.submit();
    expect(authStub.register).not.toHaveBeenCalled();
    expect(component.form.get("first_name")!.touched).toBe(true);
  });

  it("registers and navigates to the user's home route on success", () => {
    authStub.register.and.returnValue(of({ token: "t", user: {} }));
    component.form.setValue(valid);

    component.submit();

    expect(authStub.register).toHaveBeenCalledWith(valid);
    expect(router.navigateByUrl).toHaveBeenCalledWith("/owner/getting-started");
  });

  it("shows the backend's error message on failure", () => {
    authStub.register.and.returnValue(throwError(() => new HttpErrorResponse({ error: { error: "Email already taken" } })));
    component.form.setValue(valid);

    component.submit();

    expect(component.error()).toBe("Email already taken");
    expect(component.loading()).toBe(false);
  });
});
