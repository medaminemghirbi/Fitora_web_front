import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { AuthService } from "../../core/auth/auth.service";
import { LocaleService } from "../../core/services/locale.service";
import { AdminShellComponent } from "./admin-shell.component";

describe("AdminShellComponent", () => {
  let fixture: ComponentFixture<AdminShellComponent>;
  let component: AdminShellComponent;
  let localeStub: jasmine.SpyObj<LocaleService>;

  beforeEach(async () => {
    localeStub = jasmine.createSpyObj<LocaleService>("LocaleService", ["setLocale"]);

    await TestBed.configureTestingModule({
      imports: [AdminShellComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { currentUser: () => ({ full_name: "Admin A", email: "a@x.test" }), logout: jasmine.createSpy() } },
        { provide: LocaleService, useValue: localeStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("lists the 4 admin nav items", () => {
    expect(component.navItems.map((n) => n.path)).toEqual([
      "/admin/companies",
      "/admin/pricing",
      "/admin/support",
      "/admin/updates",
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
