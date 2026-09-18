import { Component, inject, signal } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { AuthService } from "../../core/auth/auth.service";
import { MemberService } from "../../core/services/member.service";
import { ThemeService } from "../../core/services/theme.service";
import { AvatarComponent } from "../../shared/components/avatar.component";

interface MemberNavItem {
  path: string;
  icon: string;
  labelKey: string;
}

/**
 * The member's half of the app — their gym's schedule, their bookings,
 * their own file.
 *
 * Deliberately unlike OwnerShell: no permission-driven navigation, no
 * counters, no money. Three fixed destinations, a bottom tab bar on a phone
 * and a left rail on a desktop. Someone who came to book a class should
 * never meet a business dashboard.
 */
@Component({
  selector: "app-member-shell",
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, TranslateModule, AvatarComponent],
  templateUrl: "./member-shell.component.html",
  styleUrl: "./member-shell.component.scss",
})
export class MemberShellComponent {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  readonly member = inject(MemberService);

  readonly userMenuOpen = signal(false);

  readonly navItems: MemberNavItem[] = [
    { path: "/member/home", icon: "bi-calendar-week", labelKey: "member.nav.schedule" },
    { path: "/member/bookings", icon: "bi-calendar-check", labelKey: "member.nav.bookings" },
    { path: "/member/profile", icon: "bi-person", labelKey: "member.nav.profile" },
  ];

  constructor() {
    // The gym's name belongs in the bar: this is their gym's app, shown to
    // them, not a Fitora product they signed up for.
    this.member.load().subscribe({ error: () => undefined });
  }

  logout(): void {
    this.auth.logout();
  }
}
