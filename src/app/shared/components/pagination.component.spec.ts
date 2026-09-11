import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslateModule } from "@ngx-translate/core";
import { PaginationComponent } from "./pagination.component";

describe("PaginationComponent", () => {
  let fixture: ComponentFixture<PaginationComponent>;
  let component: PaginationComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationComponent, TranslateModule.forRoot()],
    }).compileComponents();
    fixture = TestBed.createComponent(PaginationComponent);
    component = fixture.componentInstance;
  });

  it("renders nothing without meta", () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".app-pagination")).toBeNull();
  });

  it("shows only the count when there's a single page", () => {
    component.meta = { page: 1, per_page: 20, total: 5, total_pages: 1 };
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".app-pagination-count").textContent).toContain("5");
    expect(fixture.nativeElement.querySelector(".app-pagination-controls")).toBeNull();
  });

  it("shows page controls when there's more than one page", () => {
    component.meta = { page: 2, per_page: 20, total: 45, total_pages: 3 };
    fixture.detectChanges();
    const [prev, next] = fixture.nativeElement.querySelectorAll(".app-pagination-controls button");
    expect(prev.disabled).toBe(false);
    expect(next.disabled).toBe(false);
  });

  it("disables prev on the first page and next on the last page", () => {
    component.meta = { page: 1, per_page: 20, total: 45, total_pages: 3 };
    fixture.detectChanges();
    const [prev] = fixture.nativeElement.querySelectorAll(".app-pagination-controls button");
    expect(prev.disabled).toBe(true);

    component.meta = { page: 3, per_page: 20, total: 45, total_pages: 3 };
    fixture.detectChanges();
    const [, next] = fixture.nativeElement.querySelectorAll(".app-pagination-controls button");
    expect(next.disabled).toBe(true);
  });

  it("emits pageChange with the target page", () => {
    component.meta = { page: 2, per_page: 20, total: 45, total_pages: 3 };
    fixture.detectChanges();
    const spy = jasmine.createSpy();
    component.pageChange.subscribe(spy);

    const [prev, next] = fixture.nativeElement.querySelectorAll(".app-pagination-controls button");
    prev.click();
    expect(spy).toHaveBeenCalledWith(1);
    next.click();
    expect(spy).toHaveBeenCalledWith(3);
  });
});
