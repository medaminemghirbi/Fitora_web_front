import { Component, signal } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { AuthService } from "../../core/auth/auth.service";
import { GymsService } from "../../core/services/gyms.service";
import { ThemeService } from "../../core/services/theme.service";
import { AvatarComponent } from "../../shared/components/avatar.component";

interface MemberNavItem {
  path: string;
  icon: string;
  labelKey: string;
}

// Distinct from OwnerShell/CoachShell/AdminShell on purpose (brief: the
// end-user experience must never look like a business dashboard) — a
// compact top bar plus a mobile bottom tab bar / desktop left rail with a
// fixed 5-item nav, instead of the permission-driven sidebar those shells
// use.
@Component({
  selector: "app-member-shell",
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, TranslateModule, AvatarComponent],
  templateUrl: "./member-shell.component.html",
  styleUrl: "./member-shell.component.scss",
})
export class MemberShellComponent {
  readonly userMenuOpen = signal(false);

  readonly navItems: MemberNavItem[] = [
    { path: "/member/home", icon: "bi-house", labelKey: "member.nav.home" },
    { path: "/member/explore", icon: "bi-calendar-week", labelKey: "member.nav.explore" },
    { path: "/member/gyms", icon: "bi-compass", labelKey: "member.nav.gyms" },
    { path: "/member/bookings", icon: "bi-calendar-check", labelKey: "member.nav.bookings" },
    { path: "/member/progress", icon: "bi-graph-up-arrow", labelKey: "member.nav.progress" },
    { path: "/member/profile", icon: "bi-person", labelKey: "member.nav.profile" },
  ];

  constructor(
    readonly auth: AuthService,
    readonly theme: ThemeService,
    readonly gyms: GymsService
  ) {
    // The member app is the PERSON's app now, not one gym's: it keeps Fitora's
    // own identity, and each gym's identity shows on that gym's own card.
    this.gyms.loadMine().subscribe({ error: () => undefined });
  }

  logout(): void {
    this.auth.logout();
  }
}
