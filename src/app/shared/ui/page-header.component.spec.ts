import { ComponentFixture, TestBed } from "@angular/core/testing";
import { PageHeaderComponent } from "./page-header.component";

describe("PageHeaderComponent", () => {
  let fixture: ComponentFixture<PageHeaderComponent>;
  let component: PageHeaderComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PageHeaderComponent] }).compileComponents();
    fixture = TestBed.createComponent(PageHeaderComponent);
    component = fixture.componentInstance;
  });

  it("renders the title, and hides the description when unset", () => {
    component.title = "Clients";
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".fx-page-header-title").textContent).toContain("Clients");
    expect(fixture.nativeElement.querySelector(".fx-page-header-desc")).toBeNull();
  });

  it("renders the description when set", () => {
    component.description = "Manage your members";
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".fx-page-header-desc").textContent).toContain("Manage your members");
  });
});
