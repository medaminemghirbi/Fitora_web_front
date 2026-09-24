import { Component, computed, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { AuthService } from "../../../core/auth/auth.service";
import { SettingsSectionsService } from "./settings-sections";
import { SettingsCompanyComponent } from "./settings-company.component";
import { SettingsBrandingComponent } from "./settings-branding.component";
import { SettingsPlanningComponent } from "./settings-planning.component";
import { SettingsBookingComponent } from "./settings-booking.component";
import { SettingsRolesComponent } from "./settings-roles.component";
import { DataExchangeComponent } from "../data-exchange/data-exchange.component";
import { SettingsAppearanceComponent } from "./settings-appearance.component";
import { ChangePasswordComponent } from "../../../shared/ui/change-password.component";

// Direction A — persistent left rail + detail panel. The rail is flush to the
// left edge and full height; `/admin/settings/:section` selects the section
// shown on the right. Bare `/admin/settings` redirects to the first section.
@Component({
  selector: "app-settings-shell",
  standalone: true,
  imports: [
    RouterLink,
    TranslateModule,
    SettingsCompanyComponent,
    SettingsBrandingComponent,
    SettingsPlanningComponent,
    SettingsBookingComponent,
    SettingsRolesComponent,
    DataExchangeComponent,
    SettingsAppearanceComponent,
    ChangePasswordComponent,
  ],
  templateUrl: "./settings-shell.component.html",
  styleUrl: "./settings-shell.component.scss",
})
export class SettingsShellComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly sectionsSvc = inject(SettingsSectionsService);

  readonly navGroups = this.sectionsSvc.navGroups;

  /** Every section, in group order — the tab row reads this directly. */
  private readonly flat = computed(() =>
    this.navGroups().flatMap((g) => g.sections.map((s) => ({ ...s, groupLabelKey: g.labelKey })))
  );

  readonly flatSections = this.flat;

  private readonly activePath = signal<string>("");
  readonly activeSection = computed(() => this.flat().find((s) => s.path === this.activePath()));

  get isAdmin(): boolean {
    return this.auth.currentUser()?.role === "admin";
  }

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((pm) => {
      const requested = pm.get("section") ?? "";
      const known = this.flat().some((s) => s.path === requested);
      if (!known) {
        const first = this.flat()[0]?.path;
        if (first) this.router.navigate(["/admin/settings", first], { replaceUrl: true });
        return;
      }
      this.activePath.set(requested);
      window.scrollTo({ top: 0 });
    });
  }

  goto(path: string): void {
    if (path) this.router.navigate(["/admin/settings", path]);
  }
}
