import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ModalComponent } from "./modal.component";

describe("ModalComponent", () => {
  let fixture: ComponentFixture<ModalComponent>;
  let component: ModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ModalComponent] }).compileComponents();
    fixture = TestBed.createComponent(ModalComponent);
    component = fixture.componentInstance;
  });

  function el<T extends Element>(selector: string): T | null {
    return fixture.nativeElement.querySelector(selector);
  }

  it("renders nothing when closed", () => {
    component.open = false;
    fixture.detectChanges();
    expect(el(".modal-backdrop-custom")).toBeNull();
  });

  it("renders the title when open", () => {
    component.open = true;
    component.title = "Edit client";
    fixture.detectChanges();
    expect(el("h3")!.textContent).toContain("Edit client");
  });

  it("emits closed on backdrop click and on the close button", () => {
    component.open = true;
    fixture.detectChanges();
    const spy = jasmine.createSpy();
    component.closed.subscribe(spy);

    (el(".modal-backdrop-custom") as HTMLElement).click();
    expect(spy).toHaveBeenCalledTimes(1);

    (el(".icon-btn") as HTMLButtonElement).click();
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("clicking the panel does not close the modal", () => {
    component.open = true;
    fixture.detectChanges();
    const spy = jasmine.createSpy();
    component.closed.subscribe(spy);

    (el(".modal-panel") as HTMLElement).click();

    expect(spy).not.toHaveBeenCalled();
  });

  it("Escape closes the modal only while open", () => {
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
