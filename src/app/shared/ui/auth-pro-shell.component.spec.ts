import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { AuthProShellComponent } from "./auth-pro-shell.component";

describe("AuthProShellComponent", () => {
  let fixture: ComponentFixture<AuthProShellComponent>;
  let component: AuthProShellComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AuthProShellComponent, TranslateModule.forRoot()],
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(AuthProShellComponent);
    component = fixture.componentInstance;
  });

  it("shows the way out to the other audience when given one", () => {
    component.asideText = "Déjà client ?";
    component.asideLinkText = "Se connecter";
    component.asideLink = "/connexion";
    fixture.detectChanges();

    const aside: HTMLElement | null = fixture.nativeElement.querySelector(".apro-aside");
    expect(aside?.textContent).toContain("Déjà client ?");
    expect(aside?.querySelector("a")?.getAttribute("href")).toBe("/connexion");
  });

  it("leaves the corner empty when there is nowhere else to send someone", () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".apro-aside")).toBeNull();
  });

  it("widens the column only for a form that needs it", () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".apro-col")?.classList).not.toContain("is-wide");

    component.wide = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".apro-col")?.classList).toContain("is-wide");
  });
});
