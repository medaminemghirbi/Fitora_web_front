import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";

// Shared by the landing page and the public auth pages — see
// landing-header.component.ts for why this lives outside features/landing.
@Component({
  selector: "app-landing-footer",
  standalone: true,
  imports: [RouterLink, TranslateModule],
  templateUrl: "./landing-footer.component.html",
  styleUrl: "./landing-footer.component.scss",
})
export class LandingFooterComponent {
  readonly currentYear = new Date().getFullYear();
}
