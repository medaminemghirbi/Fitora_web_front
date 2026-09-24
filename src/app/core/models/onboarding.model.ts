/** The steps a company walks through before it can run a day of business. */
export type OnboardingStepKey = "company" | "activities" | "spaces" | "plans" | "staff";

/**
 * `done` — the company has what the step asks for.
 * `skipped` — it said it does not need it. Reversible.
 * `current` — the one step the flow is asking for now.
 * `todo` — still outstanding, but not what is being asked.
 */
export type OnboardingStepState = "done" | "current" | "todo" | "skipped";

export interface OnboardingStep {
  key: OnboardingStepKey;
  skippable: boolean;
  state: OnboardingStepState;
  /** How many of the thing already exist; null where counting means nothing. */
  count: number | null;
}

/**
 * Where setup stands, as the server derives it. Nothing here is remembered
 * client-side: a step completed from any page, on any device, is reflected
 * the next time this is read.
 */
export interface OnboardingState {
  step: OnboardingStepKey | "done";
  complete: boolean;
  /** The admin left the flow. The steps that remain still remain. */
  dismissed: boolean;
  done_count: number;
  total: number;
  steps: OnboardingStep[];
}
