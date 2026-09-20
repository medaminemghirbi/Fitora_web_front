import { Component, inject } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { AuthService } from "../../core/auth/auth.service";
import { NavigationService } from "../../core/configuration/navigation.service";
import { AppVersionService } from "../../core/services/app-version.service";
import { BrandingService } from "../../core/services/branding.service";
import { AvatarComponent } from "../../shared/components/avatar.component";

/**
 * The owner area's left rail — the desktop navigation.
 *
 * It replaces the top bar's group dropdowns, which hid half the product
 * behind a menu. With this many destinations a rail shows them all at once,
 * grouped by the part of the business they belong to.
 *
 * It reads NavigationService, the same blueprint the top bar's mobile panel
 * reads, so permissions and feature switches are applied in one place. The
 * top bar keeps everything that is not navigation — search, notifications,
 * the company switcher, the user menu — and hides its desktop nav.
 *
 * Desktop only. Below `lg` the rail is gone and the top bar's burger panel
 * is the navigation.
 */
@Component({
  selector: "app-rail",
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslateModule, AvatarComponent],
  templateUrl: "./rail.component.html",
  styleUrl: "./rail.component.scss",
})
export class RailComponent {
  readonly auth = inject(AuthService);
  readonly nav = inject(NavigationService);
  readonly branding = inject(BrandingService);
  readonly version = inject(AppVersionService);

  /** "Propriétaire" / "Coach" / "Équipe" — who you are in this gym. */
  roleLabelKey(): string {
    const user = this.auth.currentUser();
    if (user?.role === "owner") return "nav.role_owner";
    if (user?.is_coach) return "nav.role_coach";
    return "nav.role_staff";
  }

  /** The gym you are currently in, so the rail says where as well as who. */
  gymName(): string | null {
    return this.branding.branding()?.name ?? null;
  }
}
