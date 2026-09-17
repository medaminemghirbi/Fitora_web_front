import { Component, Input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";

/**
 * The frame for every B2C account screen: the brand gradient edge to edge,
 * with the form on a white card.
 *
 * On a wide screen the card floats in the middle; on a phone it rises over
 * the gradient from the bottom, the way a consumer app does. Same component,
 * because it is the same screen — only the room it has changes.
 */
@Component({
  selector: "app-auth-member-shell",
  standalone: true,
  imports: [RouterLink, TranslateModule],
  templateUrl: "./auth-member-shell.component.html",
  styleUrl: "./auth-member-shell.component.scss",
})
export class AuthMemberShellComponent {
  /** The line over the card — the promise, not the form's title. */
  @Input() pitch = "";
  @Input() wide = false;
}
