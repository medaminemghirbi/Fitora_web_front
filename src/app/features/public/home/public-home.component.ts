import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { PublicHeaderComponent } from "../../../shared/components/public-header.component";
import { LandingFooterComponent } from "../../../shared/components/landing-footer.component";

/**
 * The front door. It does not sell — it asks who you are.
 *
 * The two doors are colour-coded to the two halves of the app: aubergine for
 * a gym, raspberry for someone looking for one. That colour is the same one
 * their sign-in wears, so whichever you pick, you can tell at a glance you
 * are still on the right side.
 */
@Component({
  selector: "app-public-home",
  standalone: true,
  imports: [RouterLink, TranslateModule, PublicHeaderComponent, LandingFooterComponent],
  templateUrl: "./public-home.component.html",
  styleUrl: "./public-home.component.scss",
})
export class PublicHomeComponent {
  readonly gymPoints = ["public.home.gym_p1", "public.home.gym_p2", "public.home.gym_p3"];
  readonly memberPoints = ["public.home.member_p1", "public.home.member_p2", "public.home.member_p3"];
  readonly gymSteps = ["public.home.gym_s1", "public.home.gym_s2", "public.home.gym_s3"];
  readonly memberSteps = ["public.home.member_s1", "public.home.member_s2", "public.home.member_s3"];
}
