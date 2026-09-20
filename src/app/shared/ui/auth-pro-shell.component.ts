import { Component, Input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";

/**
 * The frame for every B2B account screen.
 *
 * Deliberately unremarkable by default: a thin bar, then a narrow centred
 * column on plain white. A manager signing in at eight in the morning wants
 * two fields and a button, not an experience.
 *
 * `[pitch]` splits it — the promise on a full-colour half, the form on the
 * other. It is for the one screen where someone has not decided yet, and it
 * gives that screen the weight of a brand page without an image to produce.
 * Signing in, resetting a password and confirming an address all know why
 * they are here, so they stay plain.
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
  /** Split the screen and put Fitora's promise on the other half. */
  @Input() pitch = false;

  /** Four things Fitora does, named once here rather than per screen. */
  readonly pitchPoints = [
    "auth.pitch_point_booking",
    "auth.pitch_point_one_place",
    "auth.pitch_point_receipts",
    "auth.pitch_point_any_gym",
  ];
}
