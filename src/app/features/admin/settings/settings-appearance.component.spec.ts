import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslateModule } from "@ngx-translate/core";
import { SettingsAppearanceComponent } from "./settings-appearance.component";

describe("SettingsAppearanceComponent", () => {
  let fixture: ComponentFixture<SettingsAppearanceComponent>;
  let component: SettingsAppearanceComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsAppearanceComponent, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsAppearanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("lists the 3 supported locales", () => {
    expect(component.locales.map((l) => l.code)).toEqual(["fr", "en", "ar"]);
  });

  it("clicking a language button switches locale", () => {
    const buttons = fixture.nativeElement.querySelectorAll(".fx-segmented")[0].querySelectorAll("button");
    (buttons[1] as HTMLButtonElement).click();
    expect(component.locale.locale()).toBe("en");
  });

  it("clicking the dark theme button switches theme", () => {
    const buttons = fixture.nativeElement.querySelectorAll(".fx-segmented")[1].querySelectorAll("button");
    (buttons[1] as HTMLButtonElement).click();
    expect(component.theme.theme()).toBe("dark");
  });
});
