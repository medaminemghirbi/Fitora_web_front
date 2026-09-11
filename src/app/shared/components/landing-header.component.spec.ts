import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { LocaleService } from "../../core/services/locale.service";
import { LandingHeaderComponent } from "./landing-header.component";

describe("LandingHeaderComponent", () => {
  let fixture: ComponentFixture<LandingHeaderComponent>;
  let component: LandingHeaderComponent;
  let localeStub: jasmine.SpyObj<LocaleService>;

  beforeEach(async () => {
    localeStub = jasmine.createSpyObj<LocaleService>("LocaleService", ["setLocale"]);

    await TestBed.configureTestingModule({
      imports: [LandingHeaderComponent, TranslateModule.forRoot()],
      providers: [provideRouter([]), { provide: LocaleService, useValue: localeStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("lists the 3 supported locales", () => {
    expect(component.locales.map((l) => l.code)).toEqual(["fr", "en", "ar"]);
  });

  it("setLocale switches the language and closes the language menu", () => {
    component.langMenuOpen.set(true);
    component.setLocale("ar");
    expect(localeStub.setLocale).toHaveBeenCalledWith("ar");
    expect(component.langMenuOpen()).toBe(false);
  });

  it("closeMobile closes the mobile menu", () => {
    component.mobileOpen.set(true);
    component.closeMobile();
    expect(component.mobileOpen()).toBe(false);
  });
});
