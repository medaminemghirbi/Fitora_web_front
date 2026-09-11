import { HttpErrorResponse } from "@angular/common/http";
import { Component, signal } from "@angular/core";
import { ReactiveFormsModule, FormBuilder, Validators } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { AuthService } from "../../core/auth/auth.service";
import { SpinnerComponent } from "../../shared/components/spinner.component";
import { LandingHeaderComponent } from "../../shared/components/landing-header.component";
import { LandingFooterComponent } from "../../shared/components/landing-footer.component";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslateModule, SpinnerComponent, LandingHeaderComponent, LandingFooterComponent],
  templateUrl: "./login.component.html",
  styleUrl: "./auth.component.scss",
})
export class LoginComponent {
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", Validators.required],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly translate: TranslateService
  ) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const { email, password } = this.form.getRawValue();
    this.auth.login(email!, password!).subscribe({
      next: () => this.router.navigateByUrl(this.auth.homeRouteForCurrentUser()),
      error: (err) => {
        this.error.set(this.loginErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  // Deliberately never shows the backend's own error text here (unlike
  // most other forms via extractErrorMessage): /auth/login always returns
  // one deliberately generic, unlocalized-English message either way
  // ("Invalid email or password" — doesn't reveal which part was wrong,
  // or "rate_limited", a machine-readable code, once the login throttle in
  // config/initializers/rack_attack.rb kicks in) — real strings a French/
  // Arabic user should never see raw. This app's own translated copy is
  // always the right thing to show for this one endpoint.
  private loginErrorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse && err.status === 429) {
      return this.translate.instant("auth.too_many_attempts");
    }
    return this.translate.instant("auth.invalid_credentials");
  }
}
