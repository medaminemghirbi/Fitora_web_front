import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { AuthService } from "../../../core/auth/auth.service";
import { LocaleService } from "../../../core/services/locale.service";
import { RegisterComponent } from "./register.component";

describe("RegisterComponent", () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let auth: { register: jasmine.Spy };
  let router: Router;

  beforeEach(() => {
    TestBed.resetTestingModule();
    auth = { register: jasmine.createSpy("register").and.returnValue(of({ token: "t", user: {} })) };

    TestBed.configureTestingModule({
      imports: [RegisterComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: LocaleService, useValue: { locale: () => "fr" } },
      ],
    });

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, "navigateByUrl");
    fixture.detectChanges();
  });

  function fill(): void {
    component.form.setValue({
      first_name: "Amine",
      last_name: "Mghirbi",
      email: "amine@gym.test",
      password: "password123",
    });
  }

  it("does nothing until the form is filled in", () => {
    component.submit();
    expect(auth.register).not.toHaveBeenCalled();
  });

  it("refuses a password too short to be one", () => {
    fill();
    component.form.controls.password.setValue("short");
    component.submit();
    expect(auth.register).not.toHaveBeenCalled();
  });

  it("registers with the reader's own language", () => {
    fill();
    component.submit();

    expect(auth.register).toHaveBeenCalledWith({
      first_name: "Amine",
      last_name: "Mghirbi",
      email: "amine@gym.test",
      password: "password123",
      locale: "fr",
    });
  });

  // They have a login and no gym yet: the dashboard would have nothing to
  // show and the company guard would bounce them anyway.
  it("sends them to name their gym, not to the dashboard", () => {
    fill();
    component.submit();

    expect(router.navigateByUrl).toHaveBeenCalledWith("/owner/setup-company");
  });

  it("stays put and says why when the address is already taken", () => {
    auth.register.and.returnValue(throwError(() => new Error("taken")));
    fill();
    component.submit();

    expect(component.error()).toBeTruthy();
    expect(component.loading()).toBe(false);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
