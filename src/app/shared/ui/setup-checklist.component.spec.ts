import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { SetupState } from "../../core/configuration/configuration.service";
import { SetupChecklistComponent } from "./setup-checklist.component";

describe("SetupChecklistComponent", () => {
  let fixture: ComponentFixture<SetupChecklistComponent>;
  let component: SetupChecklistComponent;

  const setup: SetupState = {
    activity: true,
    contract_type: true,
    coach: false,
    work_contract: false,
    dismissed: false,
    complete: false,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetupChecklistComponent, TranslateModule.forRoot()],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SetupChecklistComponent);
    component = fixture.componentInstance;
  });

  it("lists the 4 onboarding steps", () => {
    expect(component.steps.map((s) => s.key)).toEqual(["activity", "contract_type", "coach", "work_contract"]);
  });

  it("doneCount is 0 with no setup state", () => {
    expect(component.doneCount()).toBe(0);
  });

  it("doneCount reflects how many steps are complete", () => {
    component.setup = setup;
    expect(component.doneCount()).toBe(2);
  });

  it("renders a status badge for done steps and a CTA link for pending ones", () => {
    component.setup = setup;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll(".sc-status").length).toBe(2);
    expect(fixture.nativeElement.querySelectorAll(".sc-cta").length).toBe(2);
  });

  it("shows the skip button only when dismissable, and emits dismiss on click", () => {
    component.dismissable = true;
    fixture.detectChanges();
    const spy = jasmine.createSpy();
    component.dismiss.subscribe(spy);

    (fixture.nativeElement.querySelector(".sc-skip") as HTMLButtonElement).click();
    expect(spy).toHaveBeenCalled();

    component.dismissable = false;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".sc-skip")).toBeNull();
  });
});
