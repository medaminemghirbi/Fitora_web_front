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

  it("lists 3 illustrative testimonials", () => {
    expect(component.testimonials.length).toBe(3);
  });

  it("setLocale switches the language and closes the language menu", () => {
    component.langMenuOpen.set(true);
    component.setLocale("en");
    expect(localeStub.setLocale).toHaveBeenCalledWith("en");
    expect(component.langMenuOpen()).toBe(false);
  });

  describe("ROI calculator", () => {
    it("computes at-risk revenue from members, price and the late/churn rates", () => {
      component.roiMembers.set(100);
      component.roiPrice.set(50);
      component.roiLatePct.set(10);
      component.roiChurnPct.set(20);
      // 100 * 50 * 12 = 60000 annual revenue; 30% at risk = 18000
      expect(component.roiAtRisk()).toBe(18000);
    });

    it("computes recoverable revenue as 60% of the at-risk amount", () => {
      component.roiMembers.set(100);
      component.roiPrice.set(50);
      component.roiLatePct.set(10);
      component.roiChurnPct.set(20);
      expect(component.roiRecoverable()).toBe(18000 * 0.6);
    });

    it("clamps out-of-range percentages instead of producing a negative or inflated result", () => {
      component.roiMembers.set(100);
      component.roiPrice.set(50);
      component.roiLatePct.set(-10);
      component.roiChurnPct.set(200);
      // late clamped to 0, churn clamped to 100 => 100% at risk = 60000
      expect(component.roiAtRisk()).toBe(60000);
    });
  });

  describe("FAQ accordion", () => {
    it("starts with the first question open", () => {
      expect(component.openFaq()).toBe(1);
    });

    it("toggleFaq opens a different question and closes the previous one", () => {
      component.toggleFaq(3);
      expect(component.openFaq()).toBe(3);
    });

    it("toggleFaq closes the currently open question when clicked again", () => {
      component.toggleFaq(1);
      expect(component.openFaq()).toBeNull();
    });
  });
});
