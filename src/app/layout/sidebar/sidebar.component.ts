import { Component, Input, inject } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { AuthService } from "../../core/auth/auth.service";
import { NavGroup, NavLeaf } from "../../core/configuration/navigation.service";
import { AvatarComponent } from "../../shared/components/avatar.component";

/**
 * Light, bordered left sidebar carrying the full owner nav (desktop only —
 * hidden below the lg breakpoint, where the navbar's own burger/mobile
 * panel is the fallback). Pairs with <app-navbar> in "content-only" mode
 * (showBrand/showDesktopNav off) so brand + nav render once, not twice.
 */
@Component({
  selector: "app-sidebar",
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslateModule, AvatarComponent],
  templateUrl: "./sidebar.component.html",
  styleUrl: "./sidebar.component.scss",
})
export class SidebarComponent {
  @Input() dashboardItem: NavLeaf | null = null;
  @Input() groups: NavGroup[] = [];
  @Input() secondaryItems: NavLeaf[] = [];
  @Input() brandName = "Fitora";
  @Input() brandLogoUrl: string | null = null;
  @Input() brandHome = "/owner/dashboard";

  readonly auth = inject(AuthService);

  logout(): void {
    this.auth.logout();
  }
}
