import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormModalComponent } from "./form-modal.component";

describe("FormModalComponent", () => {
  let fixture: ComponentFixture<FormModalComponent>;
  let component: FormModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormModalComponent);
    component = fixture.componentInstance;
  });

  function el<T extends Element>(selector: string): T | null {
    return fixture.nativeElement.querySelector(selector);
  }

  it("renders nothing when closed", () => {
    component.open = false;
    fixture.detectChanges();
    expect(el(".fx-fm-backdrop")).toBeNull();
  });

  it("renders the title and photo hint when open", () => {
    component.open = true;
    component.title = "New supplier";
    component.photoHint = "Square image works best";
    fixture.detectChanges();

    expect(el(".fx-fm-head h2")!.textContent).toContain("New supplier");
    expect(el(".fx-fm-photo-hint")!.textContent).toContain("Square image works best");
  });

  it("shows the photo error instead of the hint when set", () => {
    component.open = true;
    component.photoError = "Too large";
    fixture.detectChanges();
    expect(el(".fx-fm-photo-error")!.textContent).toContain("Too large");
  });

  it("shows the live name preview, or a placeholder dash when empty", () => {
    component.open = true;
    fixture.detectChanges();
    expect(el(".fx-fm-photo-live")!.textContent!.trim()).toBe("—");

    component.namePreview = "Acme Supplies";
    fixture.detectChanges();
    expect(el(".fx-fm-photo-live")!.textContent).toContain("Acme Supplies");
  });

  it("emits closed on backdrop click and on the close button", () => {
    component.open = true;
    fixture.detectChanges();
    const spy = jasmine.createSpy();
    component.closed.subscribe(spy);

    (el(".fx-fm-backdrop") as HTMLElement).click();
    expect(spy).toHaveBeenCalledTimes(1);

    (el(".fx-fm-head button") as HTMLButtonElement).click();
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("stopping propagation on the panel keeps the modal open on inner clicks", () => {
    component.open = true;
    fixture.detectChanges();
    const spy = jasmine.createSpy();
    component.closed.subscribe(spy);

    (el(".fx-fm") as HTMLElement).click();

    expect(spy).not.toHaveBeenCalled();
  });

  it("emits photoSelected when the file input changes", () => {
    component.open = true;
    fixture.detectChanges();
    const spy = jasmine.createSpy();
    component.photoSelected.subscribe(spy);

    const input = el<HTMLInputElement>("#fx-fm-photo-input")!;
    input.dispatchEvent(new Event("change"));

    expect(spy).toHaveBeenCalled();
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
