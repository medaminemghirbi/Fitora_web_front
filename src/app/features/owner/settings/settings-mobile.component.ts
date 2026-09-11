import { Component, OnDestroy, OnInit, signal } from "@angular/core";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { CompanyService } from "../../../core/services/company.service";
import { ConfirmService } from "../../../core/services/confirm.service";
import { ToastService } from "../../../core/services/toast.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import { SpinnerComponent } from "../../../shared/components/spinner.component";

@Component({
  selector: "app-settings-mobile",
  standalone: true,
  imports: [TranslateModule, SpinnerComponent],
  templateUrl: "./settings-mobile.component.html",
  styleUrl: "./settings-mobile.component.scss",
})
export class SettingsMobileComponent implements OnInit, OnDestroy {
  readonly loading = signal(true);
  readonly regenerating = signal(false);
  readonly mobileAuthKey = signal<string | null>(null);
  readonly qrUrl = signal<string | null>(null);
  readonly copied = signal(false);

  constructor(
    private readonly companyService: CompanyService,
    private readonly confirm: ConfirmService,
    private readonly toast: ToastService,
    private readonly translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.companyService.get().subscribe({
      next: (res) => {
        this.mobileAuthKey.set(res.company.mobile_auth_key);
        this.loading.set(false);
        this.loadQr();
      },
      error: () => this.loading.set(false),
    });
  }

  ngOnDestroy(): void {
    const url = this.qrUrl();
    if (url) URL.revokeObjectURL(url);
  }

  private loadQr(): void {
    this.companyService.getMobileKeyQr().subscribe({
      next: (blob) => {
        const previous = this.qrUrl();
        if (previous) URL.revokeObjectURL(previous);
        this.qrUrl.set(URL.createObjectURL(blob));
      },
      error: () => {},
    });
  }

  copyKey(): void {
    const key = this.mobileAuthKey();
    if (!key) return;

    navigator.clipboard.writeText(key).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  async regenerate(): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: this.translate.instant("settings.mobile_regenerate_confirm_title"),
      body: this.translate.instant("settings.mobile_regenerate_confirm_body"),
      confirmLabel: this.translate.instant("settings.mobile_regenerate"),
      danger: true,
    });
    if (!confirmed) return;

    this.regenerating.set(true);
    this.companyService.regenerateMobileKey().subscribe({
      next: (res) => {
        this.regenerating.set(false);
        this.mobileAuthKey.set(res.company.mobile_auth_key);
        this.loadQr();
        this.toast.success(this.translate.instant("settings.mobile_regenerated"));
      },
      error: (err) => {
        this.regenerating.set(false);
        this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }
}
