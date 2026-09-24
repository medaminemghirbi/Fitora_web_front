import { Component, DestroyRef, OnInit, computed, inject, signal } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { ActivatedRoute } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { AccountRecoveryService } from "../../core/auth/account-recovery.service";
import { AuthProShellComponent } from "../../shared/ui/auth-pro-shell.component";
import { AuthService } from "../../core/auth/auth.service";
import { AUTH_CHANNEL, CONTINUE_DELAY_MS } from "./confirm-email.component";
import { MailStageComponent, MailStageState } from "./mail-stage.component";
import { SetupProgressComponent } from "./setup-progress.component";

type Status = "verifying" | "success" | "error";

/**
 * Where the emailed link lands.
 *
 * Deliberately NOT under the guest-only routes — someone already signed in
 * on this device should land here and see it succeed. Three ways it goes:
 *
 *   - signed in here (same browser): the check draws itself and the page
 *     moves on to naming the gym by itself;
 *   - opened somewhere else (a phone): it says so, and that the screen they
 *     signed up on has already moved on — it asks every few seconds;
 *   - the link is stale: it offers a fresh one, from the waiting screen.
 */
@Component({
  selector: "app-verify-email",
  standalone: true,
  imports: [AuthProShellComponent, RouterLink, TranslateModule, MailStageComponent, SetupProgressComponent],
  templateUrl: "./verify-email.component.html",
  styleUrls: ["./auth.component.scss", "./confirm-email.component.scss"],
})
export class VerifyEmailComponent implements OnInit {
  private readonly recovery = inject(AccountRecoveryService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly status = signal<Status>("verifying");
  readonly error = signal<string | null>(null);
  readonly isAuthenticated = this.auth.isAuthenticated;
  /** Signed in here, and the user record already says so. */
  readonly continuing = signal(false);
  readonly continueDelay = CONTINUE_DELAY_MS;

  readonly stage = computed<MailStageState>(() => {
    switch (this.status()) {
      case "success": return "confirmed";
      case "error": return "error";
      default: return "waiting";
    }
  });

  private timer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => {
      if (this.timer) clearTimeout(this.timer);
    });

    const token = this.route.snapshot.queryParamMap.get("token");
    if (!token) {
      this.fail();
      return;
    }

    this.recovery.verifyEmail(token).subscribe({
      next: () => {
        this.status.set("success");
        this.tellOtherTabs();

        // The backend record is verified; the cached user is not. Refresh
        // it before moving on, or the route guards would still read
        // "unconfirmed" and send the admin back to the waiting screen.
        if (this.isAuthenticated()) {
          this.auth.refreshCurrentUser().subscribe({
            next: () => {
              this.continuing.set(true);
              this.timer = setTimeout(() => this.continue(), CONTINUE_DELAY_MS);
            },
            error: () => {},
          });
        }
      },
      // The only error this endpoint returns is the machine code
      // "invalid_or_expired_token" — never worth showing raw, so this
      // app's own translated copy is always the right message here.
      error: () => this.failUnlessAlreadyConfirmed(),
    });
  }

  /**
   * Confirming spends the token, so a second click on the same link (or on
   * an older one) is refused. For someone signed in whose address is in
   * fact confirmed, that is not a failure worth showing.
   */
  private failUnlessAlreadyConfirmed(): void {
    if (!this.isAuthenticated()) {
      this.fail();
      return;
    }

    this.auth.refreshCurrentUser().subscribe({
      next: (user) => {
        if (!user.email_verified) {
          this.fail();
          return;
        }
        this.status.set("success");
        this.continuing.set(true);
        this.timer = setTimeout(() => this.continue(), CONTINUE_DELAY_MS);
      },
      error: () => this.fail(),
    });
  }

  continueUrl(): string {
    if (!this.isAuthenticated()) return "/connexion";
    const user = this.auth.currentUser();
    if (user?.role === "admin" && user.company_id == null && user.email_verified) return "/admin/setup-company";
    return this.auth.homeRouteForCurrentUser();
  }

  continue(): void {
    if (this.timer) clearTimeout(this.timer);
    this.router.navigateByUrl(this.continueUrl());
  }

  private fail(): void {
    this.status.set("error");
    this.error.set(this.translate.instant("auth.verify_email_invalid_link"));
  }

  /** The waiting screen, if it is open in another tab, moves on at once. */
  private tellOtherTabs(): void {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(AUTH_CHANNEL);
    channel.postMessage({ type: "email-verified" });
    channel.close();
  }
}
