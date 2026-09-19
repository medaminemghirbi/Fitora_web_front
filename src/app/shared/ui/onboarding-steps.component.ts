import { Component, EventEmitter, Input, Output } from "@angular/core";
import { RouterLink } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { OnboardingState, OnboardingStep, OnboardingStepKey } from "../../core/models/onboarding.model";

/** What each step is called, where it is done, and what it looks like. */
interface StepMeta {
  labelKey: string;
  descKey: string;
  route: string;
  icon: string;
}

const META: Record<OnboardingStepKey, StepMeta> = {
  company: { labelKey: "onboarding.step_company", descKey: "onboarding.step_company_desc", route: "/owner/settings/company", icon: "bi-building" },
  activities: { labelKey: "onboarding.step_activities", descKey: "onboarding.step_activities_desc", route: "/owner/catalogue", icon: "bi-lightning-charge" },
  spaces: { labelKey: "onboarding.step_spaces", descKey: "onboarding.step_spaces_desc", route: "/owner/spaces", icon: "bi-door-open" },
  plans: { labelKey: "onboarding.step_plans", descKey: "onboarding.step_plans_desc", route: "/owner/catalogue", icon: "bi-card-checklist" },
  staff: { labelKey: "onboarding.step_staff", descKey: "onboarding.step_staff_desc", route: "/owner/team", icon: "bi-person-badge" },
};

/**
 * The setup steps, as a list. Presentational: which steps exist and what
 * state each is in comes from the server (OnboardingState), because a
 * checklist the client works out for itself goes stale the moment someone
 * creates an activity in another tab.
 *
 * Rendered twice — compact on the dashboard, full on the flow page.
 */
@Component({
  selector: "app-onboarding-steps",
  standalone: true,
  imports: [RouterLink, TranslateModule],
  templateUrl: "./onboarding-steps.component.html",
  styleUrl: "./onboarding-steps.component.scss",
})
export class OnboardingStepsComponent {
  @Input({ required: true }) state: OnboardingState | null = null;
  /** Dashboard card: descriptions and skip links drop away. */
  @Input() compact = false;
  @Output() skip = new EventEmitter<OnboardingStepKey>();

  meta(step: OnboardingStep): StepMeta {
    return META[step.key];
  }

  progress(): number {
    const s = this.state;
    if (!s || s.total === 0) return 0;
    return (s.done_count / s.total) * 100;
  }
}
