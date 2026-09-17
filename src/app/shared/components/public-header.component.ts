import { Component, signal } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";

/**
 * The bar above every page a stranger can reach: the home, the directory and
 * a gym's page.
 *
 * "Explorer les salles" is the only coloured link in it, on purpose — it is
 * the one thing someone can do here without giving anything away.
 */
@Component({
  selector: "app-public-header",
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslateModule],
  templateUrl: "./public-header.component.html",
  styleUrl: "./public-header.component.scss",
})
export class PublicHeaderComponent {
  readonly mobileOpen = signal(false);
}
