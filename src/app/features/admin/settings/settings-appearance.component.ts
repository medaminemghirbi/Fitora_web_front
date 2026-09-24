import { Component, inject } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { Locale, LocaleService } from "../../../core/services/locale.service";
import { ThemeService } from "../../../core/services/theme.service";

@Component({
  selector: "app-settings-appearance",
  standalone: true,
  imports: [TranslateModule],
  template: `
    <div class="app-card">
      <div class="app-card-body sa-body">
        <div class="sa-row">
          <span class="sa-label">{{ "settings.language" | translate }}</span>
          <div class="fx-segmented">
            @for (l of locales; track l.code) {
              <button type="button" [class.is-active]="locale.locale() === l.code" (click)="locale.setLocale(l.code)">{{ l.label }}</button>
            }
          </div>
        </div>
        <div class="sa-row">
          <span class="sa-label">{{ "settings.theme" | translate }}</span>
          <div class="fx-segmented">
            <button type="button" [class.is-active]="theme.theme() === 'light'" (click)="theme.setTheme('light')">
              <i class="bi bi-sun"></i> {{ "settings.theme_light" | translate }}
            </button>
            <button type="button" [class.is-active]="theme.theme() === 'dark'" (click)="theme.setTheme('dark')">
              <i class="bi bi-moon"></i> {{ "settings.theme_dark" | translate }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .sa-body { display: flex; flex-direction: column; gap: var(--space-4); }
      .sa-row { display: flex; align-items: center; gap: var(--space-4); flex-wrap: wrap; }
      .sa-label {
        min-width: 90px;
        font-size: var(--font-size-xs);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--color-text-secondary);
      }
    `,
  ],
})
export class SettingsAppearanceComponent {
  readonly locale = inject(LocaleService);
  readonly theme = inject(ThemeService);

  readonly locales: { code: Locale; label: string }[] = [
    { code: "fr", label: "Français" },
    { code: "en", label: "English" },
    { code: "ar", label: "العربية" },
  ];
}
