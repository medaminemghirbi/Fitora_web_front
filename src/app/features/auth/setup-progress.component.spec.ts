import { ComponentFixture, TestBed, fakeAsync, tick } from "@angular/core/testing";
import { TranslateModule } from "@ngx-translate/core";
import { SetupProgressComponent } from "./setup-progress.component";

describe("SetupProgressComponent", () => {
  let fixture: ComponentFixture<SetupProgressComponent>;
  let component: SetupProgressComponent;

  function states(): string[] {
    return Array.from(fixture.nativeElement.querySelectorAll("li")).map((li) => (li as HTMLElement).dataset["state"]!);
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SetupProgressComponent, TranslateModule.forRoot()] });
    fixture = TestBed.createComponent(SetupProgressComponent);
    component = fixture.componentInstance;
    component.duration = 1000;
  });

  // The address is confirmed by the time this shows; the rest ticks over
  // across the wait, the last line just before the page moves on.
  it("opens with the address done, then ticks the account and the gym over", fakeAsync(() => {
    fixture.detectChanges();
    expect(states()).toEqual(["done", "active", "todo"]);

    tick(350);
    fixture.detectChanges();
    expect(states()).toEqual(["done", "done", "active"]);

    tick(500);
    fixture.detectChanges();
    expect(states()).toEqual(["done", "done", "done"]);
  }));

  it("stops its timers when the page moves on early", fakeAsync(() => {
    fixture.detectChanges();
    fixture.destroy();
    tick(1000);
    expect(component.current()).toBe(1);
  }));
});
