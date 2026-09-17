import { Component, OnInit, signal } from "@angular/core";
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { AuthProShellComponent } from "../../shared/ui/auth-pro-shell.component";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { AccountRecoveryService } from "../../core/auth/account-recovery.service";
import { extractErrorMessage, isErrorCode } from "../../core/services/error.util";
import { SpinnerComponent } from "../../shared/components/spinner.component";

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get("password")?.value;
  const confirmation = control.get("password_confirmation")?.value;
  return password && confirmation && password !== confirmation ? { mismatch: true } : null;
}

@Component({
  selector: "app-reset-password",
  standalone: true,
  imports: [AuthProShellComponent, ReactiveFormsModule, RouterLink, TranslateModule, SpinnerComponent],
  templateUrl: "./reset-password.component.html",
  styleUrl: "./auth.component.scss",
})
export class ResetPasswordComponent implements OnInit {
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly done = signal(false);
  private token = "";

  readonly form = this.fb.nonNullable.group(
    {
      password: ["", [Validators.required, Validators.minLength(8)]],
      password_confirmation: ["", Validators.required],
    },
    { validators: passwordsMatch }
  );

  constructor(
    private readonly fb: FormBuilder,
    private readonly recovery: AccountRecoveryService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get("token") ?? "";
    if (!this.token) this.error.set(this.translate.instant("auth.reset_password_invalid_link"));
  }

  submit(): void {
    if (this.form.invalid || !this.token) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.recovery.resetPassword(this.token, this.form.getRawValue().password).subscribe({
      next: () => {
        this.loading.set(false);
        this.done.set(true);
        setTimeout(() => this.router.navigateByUrl("/pro/connexion"), 2500);
      },
      error: (err) => {
        const fallback = this.translate.instant("auth.reset_password_invalid_link");
        // "invalid_or_expired_token" is a machine code, never the message
        // to show — anything else (e.g. a password validation failure) is
        // real, useful backend text worth showing as-is.
        this.error.set(isErrorCode(err, "invalid_or_expired_token") ? fallback : extractErrorMessage(err, fallback));
        this.loading.set(false);
      },
    });
  }
}
