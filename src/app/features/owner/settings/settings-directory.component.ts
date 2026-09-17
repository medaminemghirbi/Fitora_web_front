import { Component, OnInit, signal } from "@angular/core";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { Company } from "../../../core/models/company.model";
import { CompanyService } from "../../../core/services/company.service";
import { ToastService } from "../../../core/services/toast.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import { SpinnerComponent } from "../../../shared/components/spinner.component";

/**
 * Whether this gym appears in Fitora's public directory. Replaces the old
 * mobile pairing key: people no longer reach a gym with a secret code handed
 * out in person, they find it here — which is why publishing has to be the
 * owner's explicit decision, and is off until they make it.
 */
@Component({
  selector: "app-settings-directory",
  standalone: true,
  imports: [TranslateModule, SpinnerComponent],
  templateUrl: "./settings-directory.component.html",
})
export class SettingsDirectoryComponent implements OnInit {
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly company = signal<Company | null>(null);

  readonly listed = signal(false);

  constructor(
    private readonly companyService: CompanyService,
    private readonly toast: ToastService,
    private readonly translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.companyService.get().subscribe({
      next: (res) => {
        this.company.set(res.company);
        this.listed.set(!!res.company.listed_at);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggle(listed: boolean): void {
    this.saving.set(true);
    this.companyService.publish(listed).subscribe({
      next: (res) => {
        this.company.set(res.company);
        this.listed.set(!!res.company.listed_at);
        this.saving.set(false);
        this.toast.success(this.translate.instant(listed ? "settings.directory_published" : "settings.directory_unpublished"));
      },
      error: (err) => {
        this.saving.set(false);
        this.listed.set(!listed);
        this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }

  /** What a stranger would have to go on if the profile is thin. */
  missingFields(): string[] {
    const c = this.company();
    if (!c) return [];
    const missing: string[] = [];
    if (!c.city) missing.push(this.translate.instant("settings.company_city"));
    if (!c.address) missing.push(this.translate.instant("settings.company_address"));
    if (!c.description) missing.push(this.translate.instant("settings.company_description"));
    if (!c.phone) missing.push(this.translate.instant("auth.phone"));
    return missing;
  }
}
