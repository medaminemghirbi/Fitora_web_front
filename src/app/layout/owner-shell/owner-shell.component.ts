import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { RouterLink, RouterOutlet } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { AccountRecoveryService } from "../../core/auth/account-recovery.service";
import { AuthService } from "../../core/auth/auth.service";
import { ConfigurationService } from "../../core/configuration/configuration.service";
import { NavigationService } from "../../core/configuration/navigation.service";
import { BrandingService } from "../../core/services/branding.service";
import { AppVersionService } from "../../core/services/app-version.service";
import { MobileBarComponent } from "../mobile-bar/mobile-bar.component";
import { NavbarComponent } from "../navbar/navbar.component";

@Component({
  selector: "app-owner-shell",
  standalone: true,
  imports: [RouterLink, RouterOutlet, TranslateModule, NavbarComponent, MobileBarComponent],
  templateUrl: "./owner-shell.component.html",
  styleUrl: "./owner-shell.component.scss",
})
export class OwnerShellComponent implements OnInit {
  readonly version = inject(AppVersionService);
  private readonly recovery = inject(AccountRecoveryService);

  // Navigation is resolved from enabled modules + permissions (see NavigationService).
  readonly dashboardNavItem = this.nav.dashboardItem;
  readonly navGroups = this.nav.groups;
  readonly secondaryNavItems = this.nav.secondaryItems;
  readonly showOwnerOnlySections = computed(() => this.auth.currentUser()?.role === "owner");


  /**
   * Days left to settle before access closes. Shown from the day the paid
   * period runs out, so the owner sees it coming instead of finding the
   * door shut mid-task. The free trial is one of these periods like any
   * other, so it warns on its way out too.
   */
  readonly daysToSettle = computed(() => {
    const sub = this.configuration.subscription();
    if (!sub || sub.current_period_paid) return null;
    return sub.days_before_lock;
  });

  readonly versionSuffix = computed(() => (this.version.current() ? `v${this.version.current()}` : null));

  // Dismissible per session only — not persisted, so it comes back next
  // login until the address is actually verified.
  readonly emailUnverified = computed(() => this.auth.currentUser()?.email_verified === false);
  readonly emailBannerDismissed = signal(false);
  readonly resendingVerification = signal(false);
  readonly verificationResent = signal(false);

  constructor(
    readonly auth: AuthService,
    readonly branding: BrandingService,
    readonly nav: NavigationService,
    private readonly configuration: ConfigurationService
  ) {
    // The shell may render before /bootstrap resolves on a fresh login;
    // make sure configuration (and therefore the nav) hydrates.
    if (!this.configuration.ready()) {
      this.auth.loadConfiguration();
    }
  }

  ngOnInit(): void {
    this.version.load();
  }

  resendVerificationEmail(): void {
    this.resendingVerification.set(true);
    this.recovery.resendVerification().subscribe({
      next: () => {
        this.resendingVerification.set(false);
        this.verificationResent.set(true);
      },
      error: () => this.resendingVerification.set(false),
    });
  }
}
