import { ComponentFixture, TestBed } from "@angular/core/testing";
import { SpinnerComponent } from "./spinner.component";

describe("SpinnerComponent", () => {
  let fixture: ComponentFixture<SpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SpinnerComponent] }).compileComponents();
    fixture = TestBed.createComponent(SpinnerComponent);
  });

  it("defaults to 20px", () => {
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector(".app-spinner") as HTMLElement;
    expect(el.style.width).toBe("20px");
    expect(el.style.height).toBe("20px");
  });

  it("honors a custom size", () => {
    fixture.componentInstance.size = 40;
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector(".app-spinner") as HTMLElement;
    expect(el.style.width).toBe("40px");
  });
});
