import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { LocaleService } from "../../core/services/locale.service";
import { LandingComponent } from "./landing.component";

describe("LandingComponent", () => {
  let fixture: ComponentFixture<LandingComponent>;
  let component: LandingComponent;
  let localeStub: jasmine.SpyObj<LocaleService>;

  beforeEach(async () => {
    localeStub = jasmine.createSpyObj<LocaleService>("LocaleService", ["setLocale"]);

    await TestBed.configureTestingModule({
      imports: [LandingComponent, TranslateModule.forRoot()],
      providers: [provideRouter([]), { provide: LocaleService, useValue: localeStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("exposes the current year", () => {
    expect(component.year()).toBe(new Date().getFullYear());
  });

  it("lists the supported locales", () => {
    expect(component.locales.length).toBeGreaterThan(0);
  });

  it("the illustrative week grid has 3 rows", () => {
    expect(component.week.length).toBe(3);
  });

  it("setLocale switches the language and closes the language menu", () => {
    component.langMenuOpen.set(true);
    component.setLocale("en");
    expect(localeStub.setLocale).toHaveBeenCalledWith("en");
    expect(component.langMenuOpen()).toBe(false);
  });
});
