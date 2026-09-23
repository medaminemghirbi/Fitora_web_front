import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { LocaleService } from "../../core/services/locale.service";
import { AuthProShellComponent } from "./auth-pro-shell.component";

@Component({
  standalone: true,
  imports: [AuthProShellComponent],
  template: `
    <app-auth-pro-shell>
      <p authPanel class="probe-panel">Bon retour.</p>
      <form class="probe-form"></form>
    </app-auth-pro-shell>
  `,
})
class HostComponent {}

describe("AuthProShellComponent", () => {
  let fixture: ComponentFixture<AuthProShellComponent>;
  let component: AuthProShellComponent;
  let localeStub: jasmine.SpyObj<LocaleService> & { locale: () => string };

  beforeEach(() => {
    localeStub = Object.assign(jasmine.createSpyObj<LocaleService>("LocaleService", ["setLocale"]), {
      locale: () => "fr",
    });

    TestBed.configureTestingModule({
      imports: [AuthProShellComponent, HostComponent, TranslateModule.forRoot()],
      providers: [provideRouter([]), { provide: LocaleService, useValue: localeStub }],
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

  it("shows a way back only when given one", () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".apro-back")).toBeNull();

    component.backLinkText = "Retour à la connexion";
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".apro-back")?.getAttribute("href")).toBe("/connexion");
  });

  it("widens the column only for a form that needs it", () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".apro-col")?.classList).not.toContain("is-wide");

    component.wide = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".apro-col")?.classList).toContain("is-wide");
  });

  it("paints the panel aubergine by default and lavender when asked", () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".apro")?.classList).not.toContain("is-soft");

    component.tone = "soft";
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".apro")?.classList).toContain("is-soft");
  });

  it("switches language from the top bar and marks the current one", () => {
    fixture.detectChanges();

    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll(".apro-lang button"));
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(["FR", "EN", "ع"]);
    expect(buttons[0].getAttribute("aria-pressed")).toBe("true");

    buttons[2].click();
    expect(localeStub.setLocale).toHaveBeenCalledWith("ar");
  });

  it("puts the page's panel content in the panel and its form in the column", () => {
    const host = TestBed.createComponent(HostComponent);
    host.detectChanges();

    expect(host.nativeElement.querySelector(".apro-panel .probe-panel")).toBeTruthy();
    expect(host.nativeElement.querySelector(".apro-col .probe-form")).toBeTruthy();
    expect(host.nativeElement.querySelector(".apro-col .probe-panel")).toBeNull();
  });
});
