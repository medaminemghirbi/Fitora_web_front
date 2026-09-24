import { ComponentFixture, TestBed, fakeAsync, tick } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { AuthService } from "../../../core/auth/auth.service";
import { CompanyService } from "../../../core/services/company.service";
import { CompanySetupComponent } from "./company-setup.component";

describe("CompanySetupComponent", () => {
  let fixture: ComponentFixture<CompanySetupComponent>;
  let component: CompanySetupComponent;
  let companyService: jasmine.SpyObj<CompanyService>;
  let authStub: { refreshCurrentUser: jasmine.Spy };
  let router: Router;

  beforeEach(async () => {
    companyService = jasmine.createSpyObj<CompanyService>("CompanyService", ["create"]);
    authStub = { refreshCurrentUser: jasmine.createSpy() };

    await TestBed.configureTestingModule({
      imports: [CompanySetupComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: CompanyService, useValue: companyService },
        { provide: AuthService, useValue: authStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CompanySetupComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, "navigateByUrl");
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it("pre-fills the timezone/country from the detected location", () => {
    expect(component.form.value.timezone).toBeTruthy();
  });

  it("picking a country updates the timezone to that country's main zone", () => {
    component.form.controls.country.setValue("FR");
    expect(component.form.value.timezone).toContain("Paris");
  });

  it("submit does nothing with an invalid form", () => {
    component.form.reset();
    component.submit();
    expect(companyService.create).not.toHaveBeenCalled();
  });

  it("submit creates the company, refreshes the user, and redirects after the prep animation", fakeAsync(() => {
    component.form.patchValue({ name: "Acme Gym", timezone: "Africa/Tunis" });
    companyService.create.and.returnValue(of({ company: {} as never }));
    authStub.refreshCurrentUser.and.returnValue(of({} as never));

    component.submit();
    expect(component.preparing()).toBe(true);
    expect(component.saving()).toBe(true);

    tick(5000);

    expect(component.preparing()).toBe(false);
    expect(component.saving()).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith("/admin/getting-started");
  }));

  it("submit still redirects even if refreshing the user fails", fakeAsync(() => {
    component.form.patchValue({ name: "Acme Gym", timezone: "Africa/Tunis" });
    companyService.create.and.returnValue(of({ company: {} as never }));
    authStub.refreshCurrentUser.and.returnValue(throwError(() => new Error("nope")));

    component.submit();
    tick(5000);

    expect(router.navigateByUrl).toHaveBeenCalledWith("/admin/getting-started");
  }));

  it("submit stops preparing and shows the backend error on create failure", fakeAsync(() => {
    component.form.patchValue({ name: "Acme Gym", timezone: "Africa/Tunis" });
    companyService.create.and.returnValue(throwError(() => new Error("nope")));

    component.submit();
    tick(0);

    expect(component.preparing()).toBe(false);
    expect(component.saving()).toBe(false);
    expect(component.error()).toBeTruthy();
  }));

  it("the prep step advances over time while preparing", fakeAsync(() => {
    component.form.patchValue({ name: "Acme Gym", timezone: "Africa/Tunis" });
    companyService.create.and.returnValue(of({ company: {} as never }));
    authStub.refreshCurrentUser.and.returnValue(of({} as never));

    component.submit();
    expect(component.prepStep()).toBe(0);
    tick(1250);
    expect(component.prepStep()).toBeGreaterThan(0);

    tick(5000);
  }));

  it("ngOnDestroy clears the prep timer without throwing", fakeAsync(() => {
    component.form.patchValue({ name: "Acme Gym", timezone: "Africa/Tunis" });
    companyService.create.and.returnValue(of({ company: {} as never }));
    authStub.refreshCurrentUser.and.returnValue(of({} as never));
    component.submit();

    expect(() => fixture.destroy()).not.toThrow();
    tick(5000);
  }));
});
