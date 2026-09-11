import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DrawerComponent } from "./drawer.component";

describe("DrawerComponent", () => {
  let fixture: ComponentFixture<DrawerComponent>;
  let component: DrawerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DrawerComponent] }).compileComponents();
    fixture = TestBed.createComponent(DrawerComponent);
    component = fixture.componentInstance;
  });

  function el<T extends Element>(selector: string): T | null {
    return fixture.nativeElement.querySelector(selector);
  }

  it("renders nothing when closed", () => {
    component.open = false;
    fixture.detectChanges();
    expect(el(".fx-drawer")).toBeNull();
  });

  it("renders the title, and the description only when given", () => {
    component.open = true;
    component.title = "New coach";
    fixture.detectChanges();
    expect(el(".fx-drawer-title")!.textContent).toContain("New coach");
    expect(el(".fx-drawer-desc")).toBeNull();

    component.description = "Add a coach to your team";
    fixture.detectChanges();
    expect(el(".fx-drawer-desc")!.textContent).toContain("Add a coach");
  });

  it("applies the wide modifier class", () => {
    component.open = true;
    component.wide = true;
    fixture.detectChanges();
    expect(el(".fx-drawer--wide")).not.toBeNull();
  });

  it("emits closed on backdrop click and on the close button", () => {
    component.open = true;
    fixture.detectChanges();
    const spy = jasmine.createSpy();
    component.closed.subscribe(spy);

    (el(".fx-drawer-backdrop") as HTMLElement).click();
    expect(spy).toHaveBeenCalledTimes(1);

    (el(".icon-btn") as HTMLButtonElement).click();
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("Escape closes the drawer only while open", () => {
    component.open = false;
    const spy = jasmine.createSpy();
    component.closed.subscribe(spy);
    component.onEsc();
    expect(spy).not.toHaveBeenCalled();

    component.open = true;
    component.onEsc();
    expect(spy).toHaveBeenCalled();
  });
});
