import { Component, signal } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { AuthService } from "../../core/auth/auth.service";
import { BrandingService } from "../../core/services/branding.service";
import { ThemeService } from "../../core/services/theme.service";
import { AvatarComponent } from "../../shared/components/avatar.component";

interface NavItem {
  path: string;
  icon: string;
  labelKey: string;
}

@Component({
  selector: "app-coach-shell",
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, TranslateModule, AvatarComponent],
  templateUrl: "./coach-shell.component.html",
  styleUrl: "../owner-shell/owner-shell.component.scss",
})
export class CoachShellComponent {
  readonly sidebarOpen = signal(false);
  readonly userMenuOpen = signal(false);

  readonly navItems: NavItem[] = [{ path: "/coach/today", icon: "bi-calendar-check", labelKey: "coach.today" }];

  constructor(
    readonly auth: AuthService,
    readonly theme: ThemeService,
    readonly branding: BrandingService
  ) {
    this.branding.load();
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
  }
}
