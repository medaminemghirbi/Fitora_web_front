import { Component, OnInit, computed, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
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

export type PasswordStrength = 0 | 1 | 2 | 3 | 4;

/**
 * A rough read of a new password, for the bar under the field — a nudge,
 * not a rule: the only thing the form enforces is the 8-character minimum.
 * 0 = empty, 1 = too short, then 2–4 by how many of mixed case, a digit,
 * a symbol and 12+ characters it has.
 */
export function passwordStrength(password: string): PasswordStrength {
  if (!password) return 0;
  if (password.length < 8) return 1;

  let variety = 0;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) variety++;
  if (/\d/.test(password)) variety++;
  if (/[^A-Za-z0-9]/.test(password)) variety++;
  if (password.length >= 12) variety++;

  return variety >= 3 ? 4 : variety === 2 ? 3 : 2;
}

@Component({
  selector: "app-reset-password",
  standalone: true,
  imports: [AuthProShellComponent, ReactiveFormsModule, RouterLink, TranslateModule, SpinnerComponent],
  templateUrl: "./reset-password.component.html",
  styleUrl: "./auth.component.scss",
})
/**
 * Choosing a password from an emailed link. Two links lead here: a password
 * reset, and a member's invitation to their gym's app (route data
 * `mode: "invitation"`). The form is the same; the words and the endpoint
 * differ.
 */
export class ResetPasswordComponent implements OnInit {
  readonly invitation = this.route.snapshot.data?.["mode"] === "invitation";
  readonly copy = this.invitation
    ? {
        titleKey: "auth.invitation_title",
        subtitleKey: "auth.invitation_hint",
        labelKey: "auth.invitation_submit",
        doneTitleKey: "auth.invitation_done_title",
        doneBodyKey: "auth.invitation_done_body",
        invalidKey: "auth.invitation_invalid_link",
        panelTitle1Key: "auth.invitation_panel_title_1",
        panelTitle2Key: "auth.invitation_panel_title_2",
        panelLeadKey: "auth.invitation_panel_lead",
      }
    : {
        titleKey: "auth.reset_password_title",
        subtitleKey: "auth.reset_password_hint",
        labelKey: "auth.reset_password_submit",
        doneTitleKey: "auth.reset_password_done_title",
        doneBodyKey: "auth.reset_password_done_body",
        invalidKey: "auth.reset_password_invalid_link",
        panelTitle1Key: "auth.reset_panel_title_1",
        panelTitle2Key: "auth.reset_panel_title_2",
        panelLeadKey: "auth.reset_panel_lead",
      };

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly done = signal(false);
  readonly showPassword = signal(false);
  private token = "";

  readonly form = this.fb.nonNullable.group(
    {
      password: ["", [Validators.required, Validators.minLength(8)]],
      password_confirmation: ["", Validators.required],
    },
    { validators: passwordsMatch }
  );

  private readonly value = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  readonly strength = computed(() => passwordStrength(this.value().password ?? ""));
  readonly longEnough = computed(() => (this.value().password ?? "").length >= 8);
  readonly matches = computed(() => {
    const { password, password_confirmation } = this.value();
    return !!password && password === password_confirmation;
  });

  readonly strengthLabel: Record<PasswordStrength, string> = {
    0: "",
    1: "auth.strength_short",
    2: "auth.strength_fair",
    3: "auth.strength_good",
    4: "auth.strength_strong",
  };

  constructor(
    private readonly fb: FormBuilder,
    private readonly recovery: AccountRecoveryService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get("token") ?? "";
    if (!this.token) this.error.set(this.translate.instant(this.copy.invalidKey));
  }

  submit(): void {
    if (this.form.invalid || !this.token) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const password = this.form.getRawValue().password;
    const request = this.invitation
      ? this.recovery.acceptInvitation(this.token, password)
      : this.recovery.resetPassword(this.token, password);

    request.subscribe({
      next: () => {
        this.loading.set(false);
        this.done.set(true);
        setTimeout(() => this.router.navigateByUrl("/connexion"), 2500);
      },
      error: (err) => {
        const fallback = this.translate.instant(this.copy.invalidKey);
        // "invalid_or_expired_token" is a machine code, never the message
        // to show — anything else (e.g. a password validation failure) is
        // real, useful backend text worth showing as-is.
        this.error.set(isErrorCode(err, "invalid_or_expired_token") ? fallback : extractErrorMessage(err, fallback));
        this.loading.set(false);
      },
    });
  }
}
