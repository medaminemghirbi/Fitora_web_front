import { Component, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { LocaleService, Locale } from "../../core/services/locale.service";
import { ThemeService } from "../../core/services/theme.service";

// The marketing top nav — shared by the landing page and the public auth
// pages (login/register) so the brand chrome stays identical wherever a
// signed-out visitor lands. Features/how/pricing links always point back at
// "/" with a fragment (see app.config.ts's withInMemoryScrolling) so they
// still work from a page that isn't the landing page itself.
@Component({
  selector: "app-landing-header",
  standalone: true,
  imports: [RouterLink, TranslateModule],
  templateUrl: "./landing-header.component.html",
  styleUrl: "./landing-header.component.scss",
})
export class LandingHeaderComponent {
  readonly langMenuOpen = signal(false);
  readonly mobileOpen = signal(false);

  readonly locales: { code: Locale; label: string }[] = [
    { code: "fr", label: "Français" },
    { code: "en", label: "English" },
    { code: "ar", label: "العربية" },
  ];

  constructor(
    readonly theme: ThemeService,
    readonly locale: LocaleService
  ) {}

  setLocale(code: Locale): void {
    this.locale.setLocale(code);
    this.langMenuOpen.set(false);
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }
}
