import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslateModule } from "@ngx-translate/core";
import { FilterRailComponent } from "./filter-rail.component";

describe("FilterRailComponent", () => {
  let fixture: ComponentFixture<FilterRailComponent>;
  let component: FilterRailComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterRailComponent, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterRailComponent);
    component = fixture.componentInstance;
  });

  function el<T extends Element>(selector: string): T | null {
    return fixture.nativeElement.querySelector(selector);
  }

  it("shows the result count only when total is not null", () => {
    fixture.detectChanges();
    expect(el(".fx-rail-count")).toBeNull();

    component.total = 12;
    fixture.detectChanges();
    expect(el(".fx-rail-count")!.textContent).toContain("12");
  });

  it("shows the reset button only when hasFilters is true", () => {
    fixture.detectChanges();
    expect(el(".fx-rail-reset")).toBeNull();

    component.hasFilters = true;
    fixture.detectChanges();
    expect(el(".fx-rail-reset")).not.toBeNull();
  });

  it("emits resetFilters when the reset button is clicked", () => {
    component.hasFilters = true;
    fixture.detectChanges();
    const spy = jasmine.createSpy();
    component.resetFilters.subscribe(spy);

    (el(".fx-rail-reset") as HTMLButtonElement).click();

    expect(spy).toHaveBeenCalled();
  });

  it("opens the mobile rail via the toggle button and shows a backdrop", () => {
    fixture.detectChanges();
    expect(component.mobileOpen()).toBe(false);
    expect(el(".fx-rail-backdrop")).toBeNull();

    (el(".fx-rail-toggle") as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(component.mobileOpen()).toBe(true);
    expect(el(".fx-rail-backdrop")).not.toBeNull();
  });

  it("clicking the backdrop closes the mobile rail", () => {
    component.mobileOpen.set(true);
    fixture.detectChanges();

    (el(".fx-rail-backdrop") as HTMLElement).click();
    fixture.detectChanges();

    expect(component.mobileOpen()).toBe(false);
  });

  it("the close button inside the rail closes it", () => {
    component.mobileOpen.set(true);
    fixture.detectChanges();

    (el(".fx-rail-close") as HTMLButtonElement).click();

    expect(component.mobileOpen()).toBe(false);
  });

  it("Escape closes the mobile rail", () => {
    component.mobileOpen.set(true);
    component.onEsc();
    expect(component.mobileOpen()).toBe(false);
  });
});
