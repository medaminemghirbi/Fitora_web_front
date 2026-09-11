import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EmptyStateComponent } from "./empty-state.component";

describe("EmptyStateComponent", () => {
  let fixture: ComponentFixture<EmptyStateComponent>;
  let component: EmptyStateComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [EmptyStateComponent] }).compileComponents();
    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
  });

  it("defaults the icon to bi-inbox", () => {
    expect(component.icon).toBe("bi-inbox");
  });

  it("renders the title and, when given, the body", () => {
    component.title = "No clients yet";
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".fx-state-body")).toBeNull();

    component.body = "Add your first client to get started.";
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".fx-state-title").textContent).toContain("No clients yet");
    expect(fixture.nativeElement.querySelector(".fx-state-body").textContent).toContain("Add your first client");
  });
});
