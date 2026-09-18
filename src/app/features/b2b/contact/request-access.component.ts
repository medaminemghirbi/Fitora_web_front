import { Component, HostBinding, OnInit, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { LeadKind, LeadsService } from "../../../core/services/leads.service";
import { LocaleService } from "../../../core/services/locale.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import { AuthProShellComponent } from "../../../shared/ui/auth-pro-shell.component";
import { SpinnerComponent } from "../../../shared/components/spinner.component";

/**
 * How a gym gets in touch — a demo or a quote. The same form serves both
 * because the fields are identical; only the conversation that follows
 * differs, which is why the kind is a real choice and not a guess.
 */
@Component({
  selector: "app-request-access",
  standalone: true,
  imports: [AuthProShellComponent, ReactiveFormsModule, RouterLink, TranslateModule, SpinnerComponent],
  templateUrl: "./request-access.component.html",
  styleUrl: "../../auth/auth.component.scss",
})
export class RequestAccessComponent implements OnInit {
  /** A gym gives more than an email, so this form gets the wider column. */
  @HostBinding("class.auth-wide") readonly wide = true;

  readonly loading = signal(false);
  readonly sent = signal(false);
  readonly error = signal<string | null>(null);
  readonly kind = signal<LeadKind>("demo");

  readonly form = this.fb.nonNullable.group({
    contact_name: ["", Validators.required],
    gym_name: ["", Validators.required],
    email: ["", [Validators.required, Validators.email]],
    phone: [""],
    city: [""],
    message: [""],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly leads: LeadsService,
    private readonly route: ActivatedRoute,
    private readonly locale: LocaleService,
    private readonly translate: TranslateService
  ) {}

  ngOnInit(): void {
    const kind = this.route.snapshot.data["kind"] ?? this.route.snapshot.queryParamMap.get("kind");
    if (kind === "quote") this.kind.set("quote");
  }

  setKind(kind: LeadKind): void {
    this.kind.set(kind);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.leads.submit({ ...this.form.getRawValue(), kind: this.kind(), locale: this.locale.locale() }).subscribe({
      next: () => {
        this.loading.set(false);
        this.sent.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }
}
