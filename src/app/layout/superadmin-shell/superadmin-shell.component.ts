import { Component, OnInit, inject, signal } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { AuthService } from "../../core/auth/auth.service";
import { LocaleService, Locale } from "../../core/services/locale.service";
import { ThemeService } from "../../core/services/theme.service";
import { AppVersionService } from "../../core/services/app-version.service";
import { AvatarComponent } from "../../shared/components/avatar.component";
import { NotificationBellComponent } from "../notifications/notification-bell.component";

interface NavItem {
  path: string;
  labelKey: string;
}

@Component({
  selector: "app-superadmin-shell",
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, TranslateModule, AvatarComponent, NotificationBellComponent],
  templateUrl: "./superadmin-shell.component.html",
  styleUrl: "./superadmin-shell.component.scss",
})
export class SuperadminShellComponent implements OnInit {
  readonly version = inject(AppVersionService);

  readonly userMenuOpen = signal(false);
  readonly langMenuOpen = signal(false);

  readonly navItems: NavItem[] = [
    { path: "/superadmin/overview", labelKey: "superadmin.overview.nav" },
    { path: "/superadmin/companies", labelKey: "superadmin.companies" },
    { path: "/superadmin/pricing", labelKey: "superadmin.pricing_nav" },
    { path: "/superadmin/support", labelKey: "superadmin.support_nav" },
    { path: "/superadmin/updates", labelKey: "superadmin.updates_nav" },
  ];

  readonly locales: { code: Locale; label: string }[] = [
    { code: "fr", label: "Français" },
    { code: "en", label: "English" },
    { code: "ar", label: "العربية" },
  ];

  constructor(
    readonly auth: AuthService,
    readonly theme: ThemeService,
    readonly locale: LocaleService
  ) {}

  ngOnInit(): void {
    this.version.load();
  }

  setLocale(code: Locale): void {
    this.locale.setLocale(code);
    this.langMenuOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
  }
}
