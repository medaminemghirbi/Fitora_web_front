import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { RouterLink, RouterOutlet } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { AccountRecoveryService } from "../../core/auth/account-recovery.service";
import { AuthService } from "../../core/auth/auth.service";
import { ConfigurationService } from "../../core/configuration/configuration.service";
import { NavigationService } from "../../core/configuration/navigation.service";
import { BrandingService } from "../../core/services/branding.service";
import { AppVersionService } from "../../core/services/app-version.service";
import { NavbarComponent } from "../navbar/navbar.component";
import { SidebarComponent } from "../sidebar/sidebar.component";

@Component({
  selector: "app-owner-shell",
  standalone: true,
  imports: [RouterLink, RouterOutlet, TranslateModule, NavbarComponent, SidebarComponent],
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

  // Only while the company is still on the free trial — once a real
  // subscription is active, expires_at is a renewal date, not a countdown.
  readonly trialDaysRemaining = computed(() => {
    const sub = this.configuration.subscription();
    return sub?.on_trial ? (sub.trial_days_remaining ?? null) : null;
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
