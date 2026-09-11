import { ComponentFixture, TestBed, fakeAsync, tick } from "@angular/core/testing";
import { TranslateModule } from "@ngx-translate/core";
import { ActionMenuComponent } from "./action-menu.component";

describe("ActionMenuComponent", () => {
  let fixture: ComponentFixture<ActionMenuComponent>;
  let component: ActionMenuComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionMenuComponent, TranslateModule.forRoot()],
    }).compileComponents();
    fixture = TestBed.createComponent(ActionMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function el<T extends Element>(selector: string): T | null {
    return fixture.nativeElement.querySelector(selector);
  }

  it("starts closed", () => {
    expect(component.open()).toBe(false);
    expect(el(".fx-menu")).toBeNull();
  });

  it("toggle() opens the menu, stopping the click from bubbling", () => {
    const event = new MouseEvent("click");
    spyOn(event, "stopPropagation");
    component.toggle(event);
    expect(component.open()).toBe(true);
    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it("clicking the trigger toggles the menu open and closed", () => {
    (el(".fx-action-trigger") as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(component.open()).toBe(true);

    (el(".fx-action-trigger") as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(component.open()).toBe(false);
  });

  it("onMenuClick closes the menu (a projected item was clicked)", () => {
    component.open.set(true);
    component.onMenuClick();
    expect(component.open()).toBe(false);
  });

  it("closes on an outside click but stays open on an inside click", () => {
    component.open.set(true);
    component.onDocClick({ target: document.body } as unknown as MouseEvent);
    expect(component.open()).toBe(false);

    component.open.set(true);
    const inside = fixture.nativeElement.querySelector(".fx-action-menu") as HTMLElement;
    component.onDocClick({ target: inside } as unknown as MouseEvent);
    expect(component.open()).toBe(true);
  });

  it("Escape closes the menu", () => {
    component.open.set(true);
    component.onEsc();
    expect(component.open()).toBe(false);
  });

  it("closes on scroll/resize while open", () => {
    component.open.set(true);
    component.onViewportChange();
    expect(component.open()).toBe(false);
  });

  it("does nothing on scroll/resize while already closed", () => {
    component.onViewportChange();
    expect(component.open()).toBe(false);
  });

  describe("positioning", () => {
    function mockRects(trigger: Partial<DOMRect>, menu: Partial<DOMRect>): void {
      const triggerEl = el<HTMLElement>(".fx-action-trigger")!;
      spyOn(triggerEl, "getBoundingClientRect").and.returnValue({ top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, ...trigger } as DOMRect);
      // The menu element only exists once open() is true and change detection ran.
      const menuEl = el<HTMLElement>(".fx-menu")!;
      spyOn(menuEl, "getBoundingClientRect").and.returnValue({ top: 0, bottom: 0, left: 0, right: 0, width: 120, height: 80, ...menu } as DOMRect);
    }

    it("positions below the trigger when there's enough room", fakeAsync(() => {
      component.toggle(new MouseEvent("click"));
      fixture.detectChanges();
      mockRects({ top: 100, bottom: 120, left: 50, right: 100 }, {});
      tick();

      const menuEl = el<HTMLElement>(".fx-menu")!;
      expect(menuEl.style.top).toBe("124px");
    }));

    it("flips above the trigger when there's no room below", fakeAsync(() => {
      spyOnProperty(window, "innerHeight").and.returnValue(200);
      component.toggle(new MouseEvent("click"));
      fixture.detectChanges();
      mockRects({ top: 150, bottom: 180, left: 50, right: 100 }, { height: 80 });
      tick();

      const menuEl = el<HTMLElement>(".fx-menu")!;
      expect(menuEl.style.top).toBe("66px");
    }));

    it("left-aligns to the trigger when align='start'", fakeAsync(() => {
      component.align = "start";
      component.toggle(new MouseEvent("click"));
      fixture.detectChanges();
      mockRects({ top: 10, bottom: 30, left: 40, right: 90 }, { width: 120 });
      tick();

      const menuEl = el<HTMLElement>(".fx-menu")!;
      expect(menuEl.style.left).toBe("40px");
    }));

    it("clamps the menu within the viewport when it would overflow", fakeAsync(() => {
      spyOnProperty(window, "innerWidth").and.returnValue(300);
      component.toggle(new MouseEvent("click"));
      fixture.detectChanges();
      // Right-aligned to a trigger near the edge: 400 - 120 = 280, clamped down to 172.
      mockRects({ top: 10, bottom: 30, left: 360, right: 400 }, { width: 120 });
      tick();

      const menuEl = el<HTMLElement>(".fx-menu")!;
      expect(menuEl.style.left).toBe("172px"); // 300 - 120 - 8 margin
    }));

    it("does nothing when the trigger or menu isn't found (already closed)", () => {
      expect(() => (component as unknown as { position(): void }).position()).not.toThrow();
    });
  });
});
