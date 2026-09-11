import { ComponentFixture, TestBed } from "@angular/core/testing";
import { KpiCardComponent } from "./kpi-card.component";

describe("KpiCardComponent", () => {
  let fixture: ComponentFixture<KpiCardComponent>;
  let component: KpiCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [KpiCardComponent] }).compileComponents();
    fixture = TestBed.createComponent(KpiCardComponent);
    component = fixture.componentInstance;
  });

  it("renders the label and value, and applies the tone class", () => {
    component.label = "Active contracts";
    component.value = 42;
    component.tone = "success";
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector(".fx-kpi-head").textContent).toContain("Active contracts");
    expect(fixture.nativeElement.querySelector(".fx-kpi-value").textContent).toContain("42");
    expect(fixture.nativeElement.querySelector(".fx-kpi--success")).not.toBeNull();
  });

  it("hides the icon slot when no icon is given", () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".fx-kpi-icon")).toBeNull();
  });

  it("shows the icon when given", () => {
    component.icon = "bi-people";
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".fx-kpi-icon")).not.toBeNull();
  });

  it("hides the trend row when there's no trend", () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".fx-kpi-trend")).toBeNull();
  });

  it("shows an up arrow for an upward trend", () => {
    component.trend = "+12%";
    component.trendDirection = "up";
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".bi-arrow-up-short")).not.toBeNull();
  });

  it("shows a down arrow for a downward trend", () => {
    component.trend = "-3%";
    component.trendDirection = "down";
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".bi-arrow-down-short")).not.toBeNull();
  });

  it("shows neither arrow for a flat trend", () => {
    component.trend = "0%";
    component.trendDirection = "flat";
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".bi-arrow-up-short")).toBeNull();
    expect(fixture.nativeElement.querySelector(".bi-arrow-down-short")).toBeNull();
  });
});
