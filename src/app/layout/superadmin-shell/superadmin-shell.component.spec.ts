import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { AuthService } from "../../core/auth/auth.service";
import { LocaleService } from "../../core/services/locale.service";
import { SuperadminShellComponent } from "./superadmin-shell.component";

describe("SuperadminShellComponent", () => {
  let fixture: ComponentFixture<SuperadminShellComponent>;
  let component: SuperadminShellComponent;
  let localeStub: jasmine.SpyObj<LocaleService>;

  beforeEach(async () => {
    localeStub = jasmine.createSpyObj<LocaleService>("LocaleService", ["setLocale"]);

    await TestBed.configureTestingModule({
      imports: [SuperadminShellComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { currentUser: () => ({ full_name: "Superadmin A", email: "a@x.test" }), logout: jasmine.createSpy() } },
        { provide: LocaleService, useValue: localeStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SuperadminShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("lists the superadmin areas", () => {
    expect(component.navItems.map((n) => n.path)).toEqual([
      "/superadmin/overview",
      "/superadmin/companies",
      "/superadmin/pricing",
      "/superadmin/support",
      "/superadmin/updates",
    ]);
  });

  it("starts with both menus closed", () => {
    expect(component.userMenuOpen()).toBe(false);
    expect(component.langMenuOpen()).toBe(false);
  });

  it("setLocale switches the language and closes the language menu", () => {
    component.langMenuOpen.set(true);
    component.setLocale("en");
    expect(localeStub.setLocale).toHaveBeenCalledWith("en");
    expect(component.langMenuOpen()).toBe(false);
  });

  it("logout delegates to AuthService", () => {
    const auth = TestBed.inject(AuthService);
    component.logout();
    expect(auth.logout).toHaveBeenCalled();
  });
});
