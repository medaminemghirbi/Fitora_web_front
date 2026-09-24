import { Component, OnInit, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { API_ORIGIN } from "../../../core/models/api-config";
import { BrandingService } from "../../../core/services/branding.service";
import { CompanyService } from "../../../core/services/company.service";
import { ToastService } from "../../../core/services/toast.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import { SpinnerComponent } from "../../../shared/components/spinner.component";

@Component({
  selector: "app-settings-branding",
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule, SpinnerComponent],
  templateUrl: "./settings-branding.component.html",
  styleUrl: "./settings-branding.component.scss",
})
export class SettingsBrandingComponent implements OnInit {
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  readonly logoUrl = signal<string | null>(null);
  readonly logoPreview = signal<string | null>(null);
  readonly selectedLogo = signal<File | null>(null);

  readonly form = this.fb.nonNullable.group({
    slug: [""],
    primary_color: ["#4a2a8f"],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly companyService: CompanyService,
    private readonly branding: BrandingService,
    private readonly toast: ToastService,
    private readonly translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.companyService.get().subscribe({
      next: (res) => {
        const company = res.company;
        this.form.patchValue({
          slug: company.slug || "",
          primary_color: company.primary_color || "#4a2a8f",
        });
        this.logoUrl.set(company.logo_url ? `${API_ORIGIN}${company.logo_url}` : null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedLogo.set(file);

    if (!file) {
      this.logoPreview.set(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => this.logoPreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  submit(): void {
    this.saving.set(true);
    this.formError.set(null);

    const raw = this.form.getRawValue();
    this.companyService
      .updateBranding({
        slug: raw.slug || null,
        primary_color: raw.primary_color || null,
        logo: this.selectedLogo(),
      })
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          this.selectedLogo.set(null);
          this.logoPreview.set(null);
          this.logoUrl.set(res.company.logo_url ? `${API_ORIGIN}${res.company.logo_url}` : null);
          this.toast.success(this.translate.instant("common.save"));
          // Refresh the shell's header immediately rather than waiting for
          // a reload — the name/logo/color just changed underneath it.
          this.branding.load();
        },
        error: (err) => {
          this.saving.set(false);
          this.formError.set(extractErrorMessage(err, this.translate.instant("common.error_generic")));
        },
      });
  }
}
