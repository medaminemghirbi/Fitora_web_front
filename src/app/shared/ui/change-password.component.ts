import { Component, inject, signal } from "@angular/core";
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { AuthService } from "../../core/auth/auth.service";
import { ConfirmService } from "../../core/services/confirm.service";
import { extractErrorMessage, isErrorCode } from "../../core/services/error.util";
import { ToastService } from "../../core/services/toast.service";

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get("password")?.value;
  const confirmation = control.get("password_confirmation")?.value;
  return password && confirmation && password !== confirmation ? { mismatch: true } : null;
}

/**
 * Changing your own password while signed in, and signing out of every
 * device. Shared by the staff settings and the member's own profile — the
 * API answers both kinds of account the same way.
 */
@Component({
  selector: "app-change-password",
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="cp-form">
      @if (error()) {
        <div class="alert alert-danger" role="alert">{{ error() }}</div>
      }

      <div class="mb-3">
        <label for="cp-current">{{ "account.current_password" | translate }}</label>
        <input id="cp-current" type="password" class="form-control" formControlName="current_password"
               autocomplete="current-password" dir="ltr" />
      </div>
      <div class="mb-3">
        <label for="cp-new">{{ "auth.new_password" | translate }}</label>
        <input id="cp-new" type="password" class="form-control" formControlName="password"
               autocomplete="new-password" dir="ltr" />
        <small class="form-text">{{ "auth.password_min_length" | translate }}</small>
      </div>
      <div class="mb-3">
        <label for="cp-confirm">{{ "auth.confirm_password" | translate }}</label>
        <input id="cp-confirm" type="password" class="form-control" formControlName="password_confirmation"
               autocomplete="new-password" dir="ltr" />
        @if (form.hasError("mismatch") && form.controls.password_confirmation.touched) {
          <small class="text-danger">{{ "auth.password_mismatch" | translate }}</small>
        }
      </div>

      <p class="form-text">{{ "account.change_password_hint" | translate }}</p>

      <div class="cp-actions">
        <button type="button" class="btn btn-outline-secondary" [disabled]="signingOut()" (click)="signOutEverywhere()">
          <i class="bi bi-box-arrow-right"></i> {{ "account.sign_out_everywhere" | translate }}
        </button>
        <button type="submit" class="btn btn-primary" [disabled]="saving()">
          {{ (saving() ? "common.saving" : "account.change_password") | translate }}
        </button>
      </div>
    </form>
  `,
  styles: [
    `
      .cp-form { max-width: 28rem; }
      .cp-actions { display: flex; flex-wrap: wrap; gap: var(--space-2); justify-content: space-between; margin-top: var(--space-4); }
    `,
  ],
})
export class ChangePasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly saving = signal(false);
  readonly signingOut = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group(
    {
      current_password: ["", Validators.required],
      password: ["", [Validators.required, Validators.minLength(8)]],
      password_confirmation: ["", Validators.required],
    },
    { validators: passwordsMatch }
  );

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { current_password, password } = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);

    this.auth.changePassword(current_password, password).subscribe({
      next: () => {
        this.saving.set(false);
        this.form.reset();
        this.toast.success(this.translate.instant("account.password_changed"));
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(
          isErrorCode(err, "current_password_invalid")
            ? this.translate.instant("account.current_password_wrong")
            : extractErrorMessage(err, this.translate.instant("common.error_generic"))
        );
      },
    });
  }

  async signOutEverywhere(): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: this.translate.instant("account.sign_out_everywhere_title"),
      body: this.translate.instant("account.sign_out_everywhere_body"),
      confirmLabel: this.translate.instant("account.sign_out_everywhere"),
    });
    if (!confirmed) return;

    this.signingOut.set(true);
    this.auth.signOutEverywhere().subscribe({
      error: (err) => {
        this.signingOut.set(false);
        this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }
}
