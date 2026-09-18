import { Component, Input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";

/**
 * The frame for every B2B account screen: a thin bar, then a narrow centred
 * column on plain white.
 *
 * Deliberately unremarkable. A manager signing in at eight in the morning
 * wants two fields and a button, not an experience — and the flat white is
 * what tells them at a glance they are on the gym side, where the member
 * screens are a wash of colour.
 */
@Component({
  selector: "app-auth-pro-shell",
  standalone: true,
  imports: [RouterLink, TranslateModule],
  templateUrl: "./auth-pro-shell.component.html",
  styleUrl: "./auth-pro-shell.component.scss",
})
export class AuthProShellComponent {
  /** The way out to the other kind of visitor, top right. */
  @Input() asideText = "";
  @Input() asideLinkText = "";
  @Input() asideLink = "/inscription";
  /** Wider column for the demo / quote form, which has two columns of fields. */
  @Input() wide = false;
}
