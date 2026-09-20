import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ChartPoint, LineChartComponent } from "./line-chart.component";

describe("LineChartComponent", () => {
  let fixture: ComponentFixture<LineChartComponent>;
  let component: LineChartComponent;

  const months: ChartPoint[] = [
    { label: "oct.", value: 2100 },
    { label: "nov.", value: 3600 },
    { label: "déc.", value: 4820 },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [LineChartComponent] }).compileComponents();
    fixture = TestBed.createComponent(LineChartComponent);
    component = fixture.componentInstance;
    component.points = months;
    fixture.detectChanges();
  });

  it("spreads the points evenly between the gutters", () => {
    const xs = component.plotted().map((p) => p.x);

    expect(xs[0]).toBe(48);
    expect(xs.at(-1)).toBe(744);
    expect(xs[1] - xs[0]).toBeCloseTo(xs[2] - xs[1], 5);
  });

  // A point sitting exactly on the top gridline reads as clipped, so the
  // scale always leaves room above the tallest value.
  it("leaves headroom above the tallest point", () => {
    const top = Math.min(...component.plotted().map((p) => p.y));

    expect(top).toBeGreaterThan(12);
  });

  it("puts a taller value higher up the box", () => {
    const [oct, nov] = component.plotted();

    expect(nov.y).toBeLessThan(oct.y);
  });

  it("closes the area back down to the baseline", () => {
    expect(component.areaPath()).toContain("L 744 212 L 48 212 Z");
  });

  it("draws nothing but the grid when there are no points", () => {
    component.points = [];
    fixture.detectChanges();

    expect(component.plotted()).toEqual([]);
    expect(component.areaPath()).toBe("");
    expect(fixture.nativeElement.querySelectorAll("path").length).toBe(0);
  });

  it("survives a series that is all zeros rather than dividing by zero", () => {
    component.points = [
      { label: "a", value: 0 },
      { label: "b", value: 0 },
    ];
    fixture.detectChanges();

    expect(component.plotted().every((p) => Number.isFinite(p.y))).toBe(true);
  });

  it("keeps the marker inside the box instead of off its right edge", () => {
    component.marker = "4 820 DT";
    fixture.detectChanges();

    expect(component.markerX()).toBeLessThanOrEqual(744 - 118);
    expect(component.markerY()).toBeGreaterThanOrEqual(6);
  });

  it("labels the gridlines through the caller's formatter", () => {
    component.tickLabel = (v) => `${v}€`;
    fixture.detectChanges();

    expect(component.gridLines().map((l) => l.label)).toContain("0€");
  });

  it("emphasises only the first and last month on the axis", () => {
    expect(component.isEnd(0)).toBe(true);
    expect(component.isEnd(1)).toBe(false);
    expect(component.isEnd(2)).toBe(true);
  });
});
