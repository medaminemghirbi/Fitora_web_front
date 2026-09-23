import { Component, Input, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { Locale, LocaleService, LOCALES } from "../../core/services/locale.service";

/**
 * The frame for every B2B account screen — sign in, sign up, forgotten and
 * new password, e-mail confirmation.
 *
 * Two halves. On the left, a coloured panel that brands the page and says
 * one thing about the screen, projected by the page itself with an
 * `authPanel` attribute (a headline, a short list — no screenshot to keep
 * up to date). On the right, the form in a single narrow column, with the
 * language switch and an optional way out along the top.
 *
 * `tone` sets the panel: aubergine for arriving (signing in, signing up),
 * lavender for getting an account back, which should feel calmer. Below
 * the desktop breakpoint the panel is dropped and the brand moves into
 * the top bar, so the form is the first thing on a phone.
 */
@Component({
  selector: "app-auth-pro-shell",
  standalone: true,
  imports: [RouterLink, TranslateModule],
  templateUrl: "./auth-pro-shell.component.html",
  styleUrl: "./auth-pro-shell.component.scss",
})
export class AuthProShellComponent {
  readonly locale = inject(LocaleService);

  /** The way out to the other kind of visitor, top right. */
  @Input() asideText = "";
  @Input() asideLinkText = "";
  @Input() asideLink = "/inscription";
  /** A way back, top left — the password screens point at /connexion. */
  @Input() backLinkText = "";
  @Input() backLink = "/connexion";
  /** Wider column for a form with two columns of fields. */
  @Input() wide = false;
  /** Colour of the left half. */
  @Input() tone: "dark" | "soft" = "dark";

  readonly locales = LOCALES;
  readonly year = new Date().getFullYear();

  /** The switch shows codes, not names — three names do not fit a pill. */
  readonly shortLabel: Record<Locale, string> = { fr: "FR", en: "EN", ar: "ع" };
}
