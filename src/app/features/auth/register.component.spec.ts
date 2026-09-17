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
  let authStub: { registerClient: jasmine.Spy; homeRouteForCurrentUser: jasmine.Spy; register?: jasmine.Spy };
  let router: Router;

  beforeEach(async () => {
    authStub = {
      registerClient: jasmine.createSpy("registerClient"),
      homeRouteForCurrentUser: jasmine.createSpy().and.returnValue("/member/gyms"),
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
    expect(authStub.registerClient).not.toHaveBeenCalled();
    expect(component.form.get("first_name")!.touched).toBe(true);
  });

  it("registers and navigates to the user's home route on success", () => {
    authStub.registerClient.and.returnValue(of({ token: "t", user: {} }));
    component.form.setValue(valid);

    component.submit();

    expect(authStub.registerClient).toHaveBeenCalledWith(valid);
    expect(router.navigateByUrl).toHaveBeenCalledWith("/member/gyms");
  });

  it("shows the backend's error message on failure", () => {
    authStub.registerClient.and.returnValue(throwError(() => new HttpErrorResponse({ error: { error: "Email already taken" } })));
    component.form.setValue(valid);

    component.submit();

    expect(component.error()).toBe("Email already taken");
    expect(component.loading()).toBe(false);
  });

  it("only ever signs someone up as a member — a gym asks for a demo instead", () => {
    authStub.registerClient.and.returnValue(of({ token: "t", client: {} }));
    component.form.setValue({ first_name: "Rania", last_name: "F", email: "r@example.com", phone: "", password: "password123" });

    component.submit();

    expect(authStub.registerClient).toHaveBeenCalled();
    expect((authStub as { register?: jasmine.Spy }).register).toBeUndefined();
  });
});
