import { Component, signal } from "@angular/core";
import { ReactiveFormsModule, FormBuilder, Validators } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { AccountRecoveryService } from "../../core/auth/account-recovery.service";
import { extractErrorMessage, isErrorCode } from "../../core/services/error.util";
import { SpinnerComponent } from "../../shared/components/spinner.component";
import { LandingHeaderComponent } from "../../shared/components/landing-header.component";
import { LandingFooterComponent } from "../../shared/components/landing-footer.component";

@Component({
  selector: "app-forgot-password",
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslateModule, SpinnerComponent, LandingHeaderComponent, LandingFooterComponent],
  templateUrl: "./forgot-password.component.html",
  styleUrl: "./auth.component.scss",
})
export class ForgotPasswordComponent {
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly sent = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ["", [Validators.required, Validators.email]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly recovery: AccountRecoveryService,
    private readonly translate: TranslateService
  ) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.recovery.requestPasswordReset(this.form.getRawValue().email).subscribe({
      // Always the same outcome whether or not the email matches an
      // account — the backend never reveals that either.
      next: () => {
        this.loading.set(false);
        this.sent.set(true);
      },
      error: (err) => {
        // config/initializers/rack_attack.rb's password_resets/ip throttle
        // returns {error: "rate_limited"} once tripped — a machine code,
        // never worth showing raw.
        if (isErrorCode(err, "rate_limited")) {
          this.error.set(this.translate.instant("auth.too_many_attempts"));
        } else {
          this.error.set(extractErrorMessage(err, this.translate.instant("common.error_generic")));
        }
        this.loading.set(false);
      },
    });
  }
}
