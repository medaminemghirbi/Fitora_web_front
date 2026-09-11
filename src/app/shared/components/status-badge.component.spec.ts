import { ComponentFixture, TestBed } from "@angular/core/testing";
import { StatusBadgeComponent } from "./status-badge.component";

describe("StatusBadgeComponent", () => {
  let fixture: ComponentFixture<StatusBadgeComponent>;
  let component: StatusBadgeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StatusBadgeComponent] }).compileComponents();
    fixture = TestBed.createComponent(StatusBadgeComponent);
    component = fixture.componentInstance;
  });

  const cases: [string, string][] = [
    ["confirmed", "success"],
    ["completed", "info"],
    ["pending", "warning"],
    ["cancelled", "danger"],
    ["inactive", "neutral"],
  ];

  for (const [status, tone] of cases) {
    it(`maps "${status}" to the "${tone}" tone`, () => {
      component.status = status;
      expect(component.tone()).toBe(tone as never);
    });
  }

  it("falls back to neutral for an unknown status", () => {
    component.status = "something_unexpected";
    expect(component.tone()).toBe("neutral");
  });

  it("applies the tone as a CSS modifier class", () => {
    component.status = "active";
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".status-badge--success")).not.toBeNull();
  });
});
