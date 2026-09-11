import { Component, effect, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { AuthService } from "../../../core/auth/auth.service";
import { ConfigurationService } from "../../../core/configuration/configuration.service";
import { OnboardingService } from "../../../core/services/onboarding.service";
import { SetupChecklistComponent } from "../../../shared/ui/setup-checklist.component";

@Component({
  selector: "app-getting-started",
  standalone: true,
  imports: [TranslateModule, SetupChecklistComponent],
  templateUrl: "./getting-started.component.html",
  styleUrl: "./getting-started.component.scss",
})
export class GettingStartedComponent {
  private readonly config = inject(ConfigurationService);
  private readonly onboarding = inject(OnboardingService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly setup = this.config.setup;
  readonly dismissing = signal(false);

  constructor() {
    // Once every step is done (data created elsewhere in the app) or the
    // guide was dismissed, this page has no reason to exist. Defer the
    // navigation out of the effect's reactive context (router events write
    // signals in third-party subscribers — NG0600 otherwise).
    effect(() => {
      const s = this.setup();
      if (s && (s.complete || s.dismissed)) setTimeout(() => this.router.navigateByUrl("/owner/dashboard"));
    });
  }

  skip(): void {
    this.dismissing.set(true);
    this.onboarding.dismiss().subscribe({
      next: () => this.router.navigateByUrl("/owner/dashboard"),
      error: () => this.dismissing.set(false),
    });
  }

  goToDashboard(): void {
    this.router.navigateByUrl("/owner/dashboard");
  }
}
