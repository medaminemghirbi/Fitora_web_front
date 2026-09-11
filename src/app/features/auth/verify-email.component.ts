import { Component, OnInit, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { ActivatedRoute } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { AccountRecoveryService } from "../../core/auth/account-recovery.service";
import { AuthService } from "../../core/auth/auth.service";
import { SpinnerComponent } from "../../shared/components/spinner.component";
import { LandingHeaderComponent } from "../../shared/components/landing-header.component";
import { LandingFooterComponent } from "../../shared/components/landing-footer.component";

type Status = "verifying" | "success" | "error";

// Deliberately NOT under /auth (which is guest-only) — someone already
// signed in on this device should still be able to land here from the
// emailed link and see it succeed, not get bounced by guestGuard.
@Component({
  selector: "app-verify-email",
  standalone: true,
  imports: [RouterLink, TranslateModule, SpinnerComponent, LandingHeaderComponent, LandingFooterComponent],
  templateUrl: "./verify-email.component.html",
  styleUrl: "./auth.component.scss",
})
export class VerifyEmailComponent implements OnInit {
  readonly status = signal<Status>("verifying");
  readonly error = signal<string | null>(null);
  readonly isAuthenticated = this.auth.isAuthenticated;

  constructor(
    private readonly recovery: AccountRecoveryService,
    private readonly auth: AuthService,
    private readonly route: ActivatedRoute,
    private readonly translate: TranslateService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get("token");
    if (!token) {
      this.status.set("error");
      this.error.set(this.translate.instant("auth.verify_email_invalid_link"));
      return;
    }

    this.recovery.verifyEmail(token).subscribe({
      next: () => this.status.set("success"),
      // The only error this endpoint returns is the machine code
      // "invalid_or_expired_token" — never worth showing raw, so this
      // app's own translated copy is always the right message here.
      error: () => {
        this.status.set("error");
        this.error.set(this.translate.instant("auth.verify_email_invalid_link"));
      },
    });
  }

  continueUrl(): string {
    return this.isAuthenticated() ? this.auth.homeRouteForCurrentUser() : "/auth/login";
  }
}
