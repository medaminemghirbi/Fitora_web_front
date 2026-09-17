import { signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslateModule } from "@ngx-translate/core";
import { Client } from "../../../core/models/client.model";
import { AuthService } from "../../../core/auth/auth.service";
import { LocaleService } from "../../../core/services/locale.service";
import { MemberProfileComponent } from "./member-profile.component";

const client: Client = {
  id: "c1", first_name: "Jane", last_name: "Doe", full_name: "Jane Doe", email: "jane@x.test", phone: "12345678",
  active: true, login_enabled: true, email_verified: true, joined_at: "2026-01-15", current_contract: null,
};

describe("MemberProfileComponent", () => {
  let fixture: ComponentFixture<MemberProfileComponent>;
  let component: MemberProfileComponent;
  let authStub: { currentClient: jasmine.Spy; logout: jasmine.Spy };
  let localeStub: jasmine.SpyObj<LocaleService>;

  beforeEach(async () => {
    authStub = { currentClient: jasmine.createSpy().and.returnValue(client), logout: jasmine.createSpy() };
    localeStub = jasmine.createSpyObj<LocaleService>("LocaleService", ["setLocale"], { locale: signal("fr") });

    await TestBed.configureTestingModule({
      imports: [MemberProfileComponent, TranslateModule.forRoot()],
      providers: [
        { provide: AuthService, useValue: authStub },
        { provide: LocaleService, useValue: localeStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MemberProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("exposes the current client from AuthService", () => {
    expect(component.auth.currentClient()).toEqual(client);
  });

  it("lists all 3 supported locales", () => {
    expect(component.locales.map((l) => l.code)).toEqual(["fr", "en", "ar"]);
  });

  it("setLocale delegates to LocaleService", () => {
    component.setLocale("en");
    expect(localeStub.setLocale).toHaveBeenCalledWith("en");
  });

  it("logout delegates to AuthService", () => {
    component.logout();
    expect(authStub.logout).toHaveBeenCalled();
  });
});
