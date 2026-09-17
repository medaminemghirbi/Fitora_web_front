import { Component, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { AuthService } from "../../core/auth/auth.service";
import { extractErrorMessage } from "../../core/services/error.util";
import { AuthMemberShellComponent } from "../../shared/ui/auth-member-shell.component";
import { SpinnerComponent } from "../../shared/components/spinner.component";

@Component({
  selector: "app-register",
  standalone: true,
  imports: [AuthMemberShellComponent, ReactiveFormsModule, RouterLink, TranslateModule, SpinnerComponent],
  templateUrl: "./register.component.html",
  styleUrl: "./auth.component.scss",
})
export class RegisterComponent {
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    first_name: ["", Validators.required],
    last_name: ["", Validators.required],
    email: ["", [Validators.required, Validators.email]],
    phone: [""],
    password: ["", [Validators.required, Validators.minLength(8)]],
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

    // The only self-registration in the app: a person looking for a gym. A
    // gym asks for a demo or a quote instead (/demo, /devis).
    this.auth.registerClient(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl(this.auth.homeRouteForCurrentUser()),
      error: (err) => {
        this.error.set(extractErrorMessage(err, this.translate.instant("common.error_generic")));
        this.loading.set(false);
      },
    });
  }
}
