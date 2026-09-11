import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslateModule } from "@ngx-translate/core";
import { ConfirmService } from "../../core/services/confirm.service";
import { ConfirmDialogComponent } from "./confirm-dialog.component";

describe("ConfirmDialogComponent", () => {
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let confirmService: ConfirmService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    confirmService = TestBed.inject(ConfirmService);
    fixture.detectChanges();
  });

  function el<T extends Element>(selector: string): T | null {
    return fixture.nativeElement.querySelector(selector);
  }

  it("renders nothing without a pending request", () => {
    expect(el(".confirm-backdrop")).toBeNull();
  });

  it("renders the request's title/body and custom button labels", async () => {
    confirmService.ask({ title: "Delete supplier?", body: "This can't be undone.", confirmLabel: "Delete", cancelLabel: "Keep" });
    fixture.detectChanges();

    expect(el("h3")!.textContent).toContain("Delete supplier?");
    expect(el("p")!.textContent).toContain("can't be undone");
    const buttons = fixture.nativeElement.querySelectorAll(".confirm-actions button");
    expect(buttons[0].textContent).toContain("Keep");
    expect(buttons[1].textContent).toContain("Delete");
  });

  it("applies the danger button style when danger is true", () => {
    confirmService.ask({ title: "t", body: "b", danger: true });
    fixture.detectChanges();
    const confirmBtn = fixture.nativeElement.querySelectorAll(".confirm-actions button")[1];
    expect(confirmBtn.classList).toContain("btn-danger");
  });

  it("cancel button resolves false", async () => {
    const promise = confirmService.ask({ title: "t", body: "b" });
    fixture.detectChanges();

    (fixture.nativeElement.querySelectorAll(".confirm-actions button")[0] as HTMLButtonElement).click();

    await expectAsync(promise).toBeResolvedTo(false);
  });

  it("confirm button resolves true", async () => {
    const promise = confirmService.ask({ title: "t", body: "b" });
    fixture.detectChanges();

    (fixture.nativeElement.querySelectorAll(".confirm-actions button")[1] as HTMLButtonElement).click();

    await expectAsync(promise).toBeResolvedTo(true);
  });

  it("backdrop click resolves false without closing on the panel itself", async () => {
    const promise = confirmService.ask({ title: "t", body: "b" });
    fixture.detectChanges();

    (el(".confirm-backdrop") as HTMLElement).click();

    await expectAsync(promise).toBeResolvedTo(false);
  });

  it("Escape resolves false while a request is pending", async () => {
    const promise = confirmService.ask({ title: "t", body: "b" });
    fixture.detectChanges();

    fixture.componentInstance.onEsc();

    await expectAsync(promise).toBeResolvedTo(false);
  });

  it("Escape with no pending request is a no-op", () => {
    expect(() => fixture.componentInstance.onEsc()).not.toThrow();
  });
});
