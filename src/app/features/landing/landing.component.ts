import { Component, inject, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { LocaleService, Locale, LOCALES } from "../../core/services/locale.service";
import { ThemeService } from "../../core/services/theme.service";

/**
 * Public landing page — "Framboise" direction. Dark aubergine ground,
 * screenshot-free: the product is evoked with a glass "cockpit" panel and an
 * illustrated bento built from divs. The signature gradient (violet →
 * raspberry → sunglow) carries the hero, the primary CTA and the brand mark.
 * Committed to a dark look regardless of the app theme (a marketing surface,
 * not a themed one). Nav and footer are inline here rather than the shared
 * light <app-landing-header>/<app-landing-footer> used on the auth pages.
 */
@Component({
  selector: "app-landing",
  standalone: true,
  imports: [RouterLink, TranslateModule],
  templateUrl: "./landing.component.html",
  styleUrl: "./landing.component.scss",
})
export class LandingComponent {
  readonly theme = inject(ThemeService);
  readonly locale = inject(LocaleService);

  readonly langMenuOpen = signal(false);
  readonly mobileOpen = signal(false);
  readonly locales = LOCALES;
  readonly year = signal(new Date().getFullYear());

  // A gym week, purely illustrative — the mini planning grid in the first
  // feature card. `f` = full (waitlist), `on` = a class runs, "" = free slot.
  readonly week = [
    { time: "07h", cells: [{ n: "RPM", s: "on" }, { n: "", s: "" }, { n: "RPM", s: "on" }, { n: "", s: "" }, { n: "RPM", s: "on" }] },
    { time: "09h", cells: [{ n: "Pilates", s: "f" }, { n: "Yoga", s: "on" }, { n: "Pilates", s: "f" }, { n: "Yoga", s: "on" }, { n: "Pilates", s: "f" }] },
    { time: "18h", cells: [{ n: "Cross", s: "on" }, { n: "Cross", s: "on" }, { n: "", s: "" }, { n: "Cross", s: "on" }, { n: "Cross", s: "on" }] },
  ];

  setLocale(code: Locale): void {
    this.locale.setLocale(code);
    this.langMenuOpen.set(false);
  }
}
