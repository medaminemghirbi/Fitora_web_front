import { Component, OnInit, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { CompanyService } from "../../../core/services/company.service";
import { ToastService } from "../../../core/services/toast.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import { SpinnerComponent } from "../../../shared/components/spinner.component";

// getDay() / Ruby wday order, rendered Monday-first.
const WEEKDAYS: { value: number; labelKey: string }[] = [
  { value: 1, labelKey: "common.dow_mon" },
  { value: 2, labelKey: "common.dow_tue" },
  { value: 3, labelKey: "common.dow_wed" },
  { value: 4, labelKey: "common.dow_thu" },
  { value: 5, labelKey: "common.dow_fri" },
  { value: 6, labelKey: "common.dow_sat" },
  { value: 0, labelKey: "common.dow_sun" },
];

@Component({
  selector: "app-settings-planning",
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule, SpinnerComponent],
  templateUrl: "./settings-planning.component.html",
})
export class SettingsPlanningComponent implements OnInit {
  readonly loading = signal(true);
  readonly saving = signal(false);

  readonly weekdays = WEEKDAYS;
  readonly workingDays = signal<number[]>([1, 2, 3, 4, 5]);

  readonly form = this.fb.nonNullable.group({
    business_hours_start: ["06:00", Validators.required],
    business_hours_end: ["22:00", Validators.required],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly companyService: CompanyService,
    private readonly toast: ToastService,
    private readonly translate: TranslateService
  ) {}

  ngOnInit(): void {
    // Hours and working days are both the company's now — one call, not two.
    this.companyService.get().subscribe({
      next: (res) => {
        this.form.patchValue({
          business_hours_start: res.company.business_hours_start,
          business_hours_end: res.company.business_hours_end,
        });
        this.workingDays.set(res.company.working_days ?? [1, 2, 3, 4, 5]);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  isWorkingDay(value: number): boolean {
    return this.workingDays().includes(value);
  }

  toggleDay(value: number): void {
    const current = this.workingDays();
    this.workingDays.set(
      current.includes(value) ? current.filter((d) => d !== value) : [...current, value].sort((a, b) => a - b)
    );
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.workingDays().length === 0) {
      this.toast.error(this.translate.instant("settings.working_days_required"));
      return;
    }

    this.saving.set(true);
    this.companyService
      .update({ ...this.form.getRawValue(), working_days: this.workingDays() })
      .subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(this.translate.instant("common.save"));
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }
}
