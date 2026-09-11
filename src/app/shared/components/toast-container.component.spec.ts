import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ToastService } from "../../core/services/toast.service";
import { ToastContainerComponent } from "./toast-container.component";

describe("ToastContainerComponent", () => {
  let fixture: ComponentFixture<ToastContainerComponent>;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ToastContainerComponent] }).compileComponents();
    fixture = TestBed.createComponent(ToastContainerComponent);
    toastService = TestBed.inject(ToastService);
  });

  it("renders nothing with no toasts", () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll(".toast-item").length).toBe(0);
  });

  it("renders a toast per kind with its message", () => {
    toastService.success("Saved");
    toastService.error("Failed");
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll(".toast-item");
    expect(items.length).toBe(2);
    expect(items[0].classList).toContain("toast-item--success");
    expect(items[0].textContent).toContain("Saved");
    expect(items[1].classList).toContain("toast-item--error");
  });

  it("dismisses a toast via its close button", () => {
    toastService.info("FYI");
    fixture.detectChanges();

    (fixture.nativeElement.querySelector(".toast-close") as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll(".toast-item").length).toBe(0);
  });
});
