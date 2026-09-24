import { Component, HostListener, computed, signal } from "@angular/core";
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
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
  styleUrl: "../admin-shell/admin-shell.component.scss",
})
export class CoachShellComponent {
  readonly sidebarOpen = signal(false);
  readonly userMenuOpen = signal(false);

  readonly navItems: NavItem[] = [
    { path: "/coach/today", icon: "bi-calendar-check", labelKey: "coach.today" },
    { path: "/coach/members", icon: "bi-people", labelKey: "coach.members.title" },
  ];

  /** The current URL, so the top bar can name the page it is showing. */
  private readonly url = signal("");

  /**
   * The title of whichever nav item is active. Was hardcoded to "Today",
   * which stopped being true the moment the shell had a second page.
   */
  readonly titleKey = computed(
    () => this.navItems.find((item) => this.url().startsWith(item.path))?.labelKey ?? "coach.today"
  );

  constructor(
    readonly auth: AuthService,
    readonly theme: ThemeService,
    readonly branding: BrandingService,
    private readonly router: Router
  ) {
    this.branding.load();
    this.url.set(this.router.url);
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) this.url.set(event.urlAfterRedirects);
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  @HostListener("document:keydown.escape")
  onEsc(): void {
    this.closeSidebar();
  }

  logout(): void {
    this.auth.logout();
  }
}
