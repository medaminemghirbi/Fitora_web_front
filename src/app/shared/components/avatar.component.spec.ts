import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AvatarComponent } from "./avatar.component";

describe("AvatarComponent", () => {
  let fixture: ComponentFixture<AvatarComponent>;
  let component: AvatarComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AvatarComponent] }).compileComponents();
    fixture = TestBed.createComponent(AvatarComponent);
    component = fixture.componentInstance;
  });

  it("shows a question mark when there is no name", () => {
    fixture.detectChanges();
    expect(component.initials()).toBe("?");
  });

  it("shows a question mark when name is bound to undefined/null", () => {
    component.name = undefined as unknown as string;
    expect(component.initials()).toBe("?");
    component.name = null as unknown as string;
    expect(component.initials()).toBe("?");
  });

  it("shows a question mark for a blank/whitespace-only name", () => {
    component.name = "   ";
    expect(component.initials()).toBe("?");
  });

  it("uses the first letter of each of the first two words", () => {
    component.name = "Sarah Martin";
    expect(component.initials()).toBe("SM");
  });

  it("caps at 2 initials for a longer name", () => {
    component.name = "Jean Paul Dupont";
    expect(component.initials()).toBe("JP");
  });

  it("uses a single initial for a one-word name", () => {
    component.name = "Cher";
    expect(component.initials()).toBe("C");
  });

  it("collapses repeated whitespace between words", () => {
    component.name = "  Sarah   Martin  ";
    expect(component.initials()).toBe("SM");
  });

  it("applies the size input to width/height/font-size", () => {
    component.size = 48;
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector(".app-avatar") as HTMLElement;
    expect(el.style.width).toBe("48px");
    expect(el.style.fontSize).toBe("19.2px");
  });
});
