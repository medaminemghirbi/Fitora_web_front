import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { AuthProShellComponent } from "./auth-pro-shell.component";
import { AuthMemberShellComponent } from "./auth-member-shell.component";

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
    component.asideLink = "/pro/connexion";
    fixture.detectChanges();

    const aside: HTMLElement | null = fixture.nativeElement.querySelector(".apro-aside");
    expect(aside?.textContent).toContain("Déjà client ?");
    expect(aside?.querySelector("a")?.getAttribute("href")).toBe("/pro/connexion");
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

describe("AuthMemberShellComponent", () => {
  let fixture: ComponentFixture<AuthMemberShellComponent>;
  let component: AuthMemberShellComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AuthMemberShellComponent, TranslateModule.forRoot()],
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(AuthMemberShellComponent);
    component = fixture.componentInstance;
  });

  it("puts the pitch over the card, out of the a11y tree — it is decoration", () => {
    component.pitch = "Trouvez votre salle.";
    fixture.detectChanges();

    const pitch: HTMLElement | null = fixture.nativeElement.querySelector(".amem-pitch");
    expect(pitch?.textContent).toContain("Trouvez votre salle.");
    expect(pitch?.getAttribute("aria-hidden")).toBe("true");
  });

  it("always keeps a way back to the gym side", () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.amem-aside[href="/pro"]')).toBeTruthy();
  });

  it("drops the pitch entirely when there is none", () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".amem-pitch")).toBeNull();
  });
});
