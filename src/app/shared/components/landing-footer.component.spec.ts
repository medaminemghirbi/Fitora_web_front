import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { LandingFooterComponent } from "./landing-footer.component";

describe("LandingFooterComponent", () => {
  let fixture: ComponentFixture<LandingFooterComponent>;
  let component: LandingFooterComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingFooterComponent, TranslateModule.forRoot()],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("exposes the current year", () => {
    expect(component.currentYear).toBe(new Date().getFullYear());
  });

  it("renders the current year in the footer", () => {
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(String(component.currentYear));
  });
});
