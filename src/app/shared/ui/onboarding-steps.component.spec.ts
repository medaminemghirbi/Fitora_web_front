import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { OnboardingState } from "../../core/models/onboarding.model";
import { OnboardingStepsComponent } from "./onboarding-steps.component";

describe("OnboardingStepsComponent", () => {
  let fixture: ComponentFixture<OnboardingStepsComponent>;
  let component: OnboardingStepsComponent;

  const state: OnboardingState = {
    step: "activities",
    complete: false,
    dismissed: false,
    done_count: 1,
    total: 4,
    steps: [
      { key: "company", skippable: false, state: "done", count: null },
      { key: "activities", skippable: false, state: "current", count: 0 },
      { key: "plans", skippable: false, state: "todo", count: 0 },
      { key: "staff", skippable: true, state: "todo", count: 0 },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnboardingStepsComponent, TranslateModule.forRoot()],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingStepsComponent);
    component = fixture.componentInstance;
    component.state = state;
    fixture.detectChanges();
  });

  it("renders one row per step the server sent", () => {
    expect(fixture.nativeElement.querySelectorAll(".obs-item").length).toBe(4);
  });

  it("marks exactly one step as the one being asked for", () => {
    expect(fixture.nativeElement.querySelectorAll(".obs-current").length).toBe(1);
  });

  it("turns the done count into a percentage", () => {
    expect(component.progress()).toBe(25);
  });

  it("is 0% with nothing to show, rather than dividing by zero", () => {
    component.state = { ...state, total: 0, steps: [] };
    expect(component.progress()).toBe(0);

    component.state = null;
    expect(component.progress()).toBe(0);
  });

  it("offers to skip only a step that may be skipped", () => {
    const skips = fixture.nativeElement.querySelectorAll(".obs-skip");
    expect(skips.length).toBe(1);

    const emitted: string[] = [];
    component.skip.subscribe((key) => emitted.push(key));
    skips[0].click();

    expect(emitted).toEqual(["staff"]);
  });

  it("drops descriptions and skip links when compact", () => {
    component.compact = true;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll(".obs-desc").length).toBe(0);
    expect(fixture.nativeElement.querySelectorAll(".obs-skip").length).toBe(0);
  });

  it("renders nothing at all before the state arrives", () => {
    component.state = null;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector(".obs")).toBeNull();
  });
});
