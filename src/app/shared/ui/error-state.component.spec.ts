import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslateModule } from "@ngx-translate/core";
import { ErrorStateComponent } from "./error-state.component";

describe("ErrorStateComponent", () => {
  let fixture: ComponentFixture<ErrorStateComponent>;
  let component: ErrorStateComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorStateComponent, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorStateComponent);
    component = fixture.componentInstance;
  });

  it("falls back to a generic error title when none is given", () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".fx-state-title").textContent).toContain("common.error_generic");
  });

  it("shows the given title and body", () => {
    component.title = "Couldn't load clients";
    component.body = "Check your connection and try again.";
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".fx-state-title").textContent).toContain("Couldn't load clients");
    expect(fixture.nativeElement.querySelector(".fx-state-body").textContent).toContain("Check your connection");
  });

  it("shows the retry button by default and emits retry on click", () => {
    fixture.detectChanges();
    const spy = jasmine.createSpy();
    component.retry.subscribe(spy);

    (fixture.nativeElement.querySelector("button") as HTMLButtonElement).click();

    expect(spy).toHaveBeenCalled();
  });

  it("hides the retry button when showRetry is false", () => {
    component.showRetry = false;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector("button")).toBeNull();
  });
});
