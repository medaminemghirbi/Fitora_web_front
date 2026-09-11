import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslateModule } from "@ngx-translate/core";
import { SearchableOption, SearchableSelectComponent } from "./searchable-select.component";

describe("SearchableSelectComponent", () => {
  let fixture: ComponentFixture<SearchableSelectComponent>;
  let component: SearchableSelectComponent;

  const options: SearchableOption[] = [
    { value: "fr", label: "France", prefix: "🇫🇷" },
    { value: "tn", label: "Tunisia", prefix: "🇹🇳" },
    { value: "us", label: "United States", prefix: "🇺🇸" },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchableSelectComponent, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchableSelectComponent);
    component = fixture.componentInstance;
    component.options = options;
    fixture.detectChanges();
  });

  function el<T extends Element>(selector: string): T | null {
    return fixture.nativeElement.querySelector(selector);
  }
  function allEl<T extends Element>(selector: string): NodeListOf<T> {
    return fixture.nativeElement.querySelectorAll(selector);
  }

  it("starts closed with the placeholder shown", () => {
    component.placeholder = "Choose a country";
    fixture.detectChanges();
    expect(component.open()).toBe(false);
    expect(el(".ss-placeholder")!.textContent).toContain("Choose a country");
  });

  it("toggle() opens the panel and lists every option", () => {
    component.toggle();
    fixture.detectChanges();
    expect(component.open()).toBe(true);
    expect(allEl("li[role='option']").length).toBe(3);
  });

  it("does nothing when disabled", () => {
    component.setDisabledState(true);
    component.toggle();
    expect(component.open()).toBe(false);
  });

  it("writeValue()/selected() reflects the chosen option's label", () => {
    component.writeValue("tn");
    fixture.detectChanges();
    expect(el(".ss-value")!.textContent).toContain("Tunisia");
  });

  it("typing filters the option list by label or value", () => {
    component.toggle();
    component.query.set("tun");
    fixture.detectChanges();
    expect(component.filtered().map((o) => o.value)).toEqual(["tn"]);
  });

  it("pick() sets the value, calls onChange, and closes the panel", () => {
    const onChange = jasmine.createSpy();
    component.registerOnChange(onChange);
    component.toggle();

    component.pick(options[1]);

    expect(component.value()).toBe("tn");
    expect(onChange).toHaveBeenCalledWith("tn");
    expect(component.open()).toBe(false);
  });

  it("clicking an option picks it", () => {
    component.toggle();
    fixture.detectChanges();

    (allEl<HTMLLIElement>("li[role='option']")[2]).click();

    expect(component.value()).toBe("us");
  });

  it("onTriggerKey opens the panel on ArrowDown/Enter/Space while closed", () => {
    const event = new KeyboardEvent("keydown", { key: "ArrowDown" });
    spyOn(event, "preventDefault");
    component.onTriggerKey(event);
    expect(component.open()).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("onSearchKey navigates the highlight with Arrow keys", () => {
    component.toggle();
    expect(component.highlight()).toBe(0);

    component.onSearchKey(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    expect(component.highlight()).toBe(1);

    component.onSearchKey(new KeyboardEvent("keydown", { key: "ArrowUp" }));
    expect(component.highlight()).toBe(0);
  });

  it("onSearchKey wraps the highlight around both ends", () => {
    component.toggle();
    component.onSearchKey(new KeyboardEvent("keydown", { key: "ArrowUp" }));
    expect(component.highlight()).toBe(options.length - 1);
  });

  it("onSearchKey Enter picks the highlighted option", () => {
    component.toggle();
    component.highlight.set(1);
    component.onSearchKey(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(component.value()).toBe("tn");
  });

  it("onSearchKey Escape closes the panel", () => {
    component.toggle();
    component.onSearchKey(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(component.open()).toBe(false);
  });

  it("shows an empty state when nothing matches", () => {
    component.toggle();
    component.query.set("zzz");
    fixture.detectChanges();
    expect(el(".ss-empty")).not.toBeNull();
  });

  it("clicking outside the host closes the panel", () => {
    component.toggle();
    document.dispatchEvent(new MouseEvent("click"));
    expect(component.open()).toBe(false);
  });
});
