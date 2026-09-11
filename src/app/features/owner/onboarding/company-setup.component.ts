import { Component, OnDestroy, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { AuthService } from "../../../core/auth/auth.service";
import { COUNTRIES } from "../../../core/models/countries";
import { CURRENCIES } from "../../../core/models/currency";
import { ensureTimezone, guessLocation, timezoneForCountry } from "../../../core/models/timezones";
import { CompanyService } from "../../../core/services/company.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import { SpinnerComponent } from "../../../shared/components/spinner.component";
import { SearchableSelectComponent, SearchableOption } from "../../../shared/ui/searchable-select.component";

const PREP_MS = 5000;
const PREP_STEPS = ["onboarding.prep_step_1", "onboarding.prep_step_2", "onboarding.prep_step_3", "onboarding.prep_step_4"];

@Component({
  selector: "app-company-setup",
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule, SpinnerComponent, SearchableSelectComponent],
  templateUrl: "./company-setup.component.html",
  styleUrls: ["../../auth/auth.component.scss", "./company-setup.component.scss"],
})
export class CompanySetupComponent implements OnDestroy {
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  // Full-screen "we're setting up your account" moment after a successful
  // create — held for at least PREP_MS so the animation reads.
  readonly preparing = signal(false);
  readonly prepStep = signal(0);
  readonly prepSteps = PREP_STEPS;
  private prepTimer?: ReturnType<typeof setInterval>;

  private readonly detected = guessLocation();

  readonly currencies = CURRENCIES;
  readonly countryOptions: SearchableOption[] = COUNTRIES.map((c) => ({ value: c.code, label: c.name, prefix: c.flag }));
  readonly timezoneGroups = ensureTimezone(this.detected.timezone);

  readonly form = this.fb.nonNullable.group({
    name: ["", Validators.required],
    description: [""],
    phone: [""],
    email: ["", Validators.email],
    country: [this.detected.country],
    city: [""],
    address: [""],
    timezone: [this.detected.timezone, Validators.required],
    currency: ["TND", Validators.required],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly companyService: CompanyService,
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly translate: TranslateService
  ) {
    // Picking a country moves the timezone to that country's main zone — the
    // user can still fine-tune it afterwards.
    this.form.controls.country.valueChanges.subscribe((code) => {
      const tz = timezoneForCountry(code);
      if (tz) this.form.controls.timezone.setValue(tz);
    });
  }

  ngOnDestroy(): void {
    if (this.prepTimer) clearInterval(this.prepTimer);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.startPreparing();
    const startedAt = Date.now();

    this.companyService.create(this.form.getRawValue()).subscribe({
      next: () => {
        this.auth.refreshCurrentUser().subscribe({
          next: () => this.finish(startedAt),
          error: () => this.finish(startedAt),
        });
      },
      error: (err) => {
        this.stopPreparing();
        this.saving.set(false);
        this.error.set(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }

  private startPreparing(): void {
    this.preparing.set(true);
    this.prepStep.set(0);
    const per = PREP_MS / PREP_STEPS.length;
    this.prepTimer = setInterval(() => {
      this.prepStep.update((s) => Math.min(s + 1, PREP_STEPS.length - 1));
    }, per);
  }

  private stopPreparing(): void {
    if (this.prepTimer) clearInterval(this.prepTimer);
    this.prepTimer = undefined;
    this.preparing.set(false);
  }

  private finish(startedAt: number): void {
    const wait = Math.max(0, PREP_MS - (Date.now() - startedAt));
    setTimeout(() => {
      this.stopPreparing();
      this.saving.set(false);
      // A brand-new owner always starts on the "Premiers pas" guide; the
      // guide itself bounces to the dashboard once setup is done/skipped.
      this.router.navigateByUrl("/owner/getting-started");
    }, wait);
  }
}
