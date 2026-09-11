import { ComponentFixture, TestBed } from "@angular/core/testing";
import { SkeletonComponent } from "./skeleton.component";

describe("SkeletonComponent", () => {
  let fixture: ComponentFixture<SkeletonComponent>;
  let component: SkeletonComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SkeletonComponent] }).compileComponents();
    fixture = TestBed.createComponent(SkeletonComponent);
    component = fixture.componentInstance;
  });

  it("defaults to a single line", () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".fx-skeleton--text")).not.toBeNull();
    expect(fixture.nativeElement.querySelector(".fx-skeleton-table")).toBeNull();
  });

  it("renders a table with the given rows/cols", () => {
    component.variant = "table";
    component.rows = 3;
    component.cols = 2;
    fixture.detectChanges();
    // 1 header row + 3 body rows, each with 2 cells.
    expect(fixture.nativeElement.querySelectorAll(".fx-skeleton-table-row").length).toBe(4);
  });

  it("renders the given number of cards", () => {
    component.variant = "cards";
    component.count = 5;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll(".fx-skeleton-card").length).toBe(5);
  });

  it("renders the given number of kpi tiles", () => {
    component.variant = "kpi";
    component.count = 3;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll(".fx-kpi").length).toBe(3);
  });

  it("rowsArray/colsArray/countArray build arrays of the right length", () => {
    component.rows = 4;
    component.cols = 6;
    component.count = 2;
    expect(component.rowsArray.length).toBe(4);
    expect(component.colsArray.length).toBe(6);
    expect(component.countArray.length).toBe(2);
  });
});
