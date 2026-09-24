import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { AuthService } from "../../../core/auth/auth.service";
import { ConfigurationService } from "../../../core/configuration/configuration.service";
import { OnboardingStepKey } from "../../../core/models/onboarding.model";
import { extractErrorMessage } from "../../../core/services/error.util";
import { OnboardingService } from "../../../core/services/onboarding.service";
import { ToastService } from "../../../core/services/toast.service";
import { OnboardingStepsComponent } from "../../../shared/ui/onboarding-steps.component";
import { SkeletonComponent } from "../../../shared/ui/skeleton.component";
import { ActivitiesComponent } from "../activities/activities.component";
import { PlansComponent } from "../plans/plans.component";
import { SpacesComponent } from "../spaces/spaces.component";

/**
 * First-time setup, as a flow rather than a checklist.
 *
 * Resumable because the server owns the progress: close the tab on step
 * three and the next login opens on step three, from any device. Nothing
 * here remembers anything.
 *
 * The step being asked for gets the real tool inline where one already
 * exists — activities, rooms and plans are the same components the
 * catalogue renders, not a second, simpler copy of them. The steps that
 * have no such component link to the page that does the work; the flow is
 * still there when the admin comes back.
 */
@Component({
  selector: "app-onboarding",
  standalone: true,
  imports: [
    RouterLink,
    TranslateModule,
    OnboardingStepsComponent,
    SkeletonComponent,
    ActivitiesComponent,
    PlansComponent,
    SpacesComponent,
  ],
  templateUrl: "./onboarding.component.html",
  styleUrl: "./onboarding.component.scss",
})
export class OnboardingComponent implements OnInit {
  private readonly onboarding = inject(OnboardingService);
  private readonly config = inject(ConfigurationService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly state = this.onboarding.state;
  readonly loading = signal(true);
  readonly working = signal(false);

  readonly company = this.config.company;
  readonly current = computed(() => this.state()?.step ?? null);

  ngOnInit(): void {
    this.onboarding.load().subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
  }

  /** The company step is the one nothing in the database can confirm. */
  confirmCompany(): void {
    this.act(this.onboarding.complete("company"));
  }

  skip(step: OnboardingStepKey): void {
    this.act(this.onboarding.skip(step));
  }

  leave(): void {
    this.onboarding.dismiss().subscribe({
      next: () => this.router.navigateByUrl("/admin/dashboard"),
      error: (err) => this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic"))),
    });
  }

  /**
   * Every step that is not `company` is satisfied by data, so the flow
   * re-reads its own state after the admin has been working in an embedded
   * tool rather than trying to guess what changed.
   */
  refresh(): void {
    this.act(this.onboarding.load());
  }

  private act(request: ReturnType<OnboardingService["load"]>): void {
    this.working.set(true);
    request.subscribe({
      next: () => this.working.set(false),
      error: (err) => {
        this.working.set(false);
        this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }
}
