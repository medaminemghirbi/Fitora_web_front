import { Component, Input } from "@angular/core";

/**
 * The step indicator above a multi-step form.
 *
 * It shows where you are and what is left, and lets you go back to a step
 * you have already completed — never forward, because a later step reads
 * what an earlier one decided.
 */
@Component({
  selector: "app-wizard-steps",
  standalone: true,
  template: `
    <ol class="fx-wiz" [attr.aria-label]="label">
      @for (step of steps; track step; let i = $index) {
        <li
          class="fx-wiz-step"
          [class.is-current]="i === current"
          [class.is-done]="i < current"
          [attr.aria-current]="i === current ? 'step' : null"
        >
          <span class="fx-wiz-dot">
            @if (i < current) { <i class="bi bi-check-lg"></i> } @else { {{ i + 1 }} }
          </span>
          <span class="fx-wiz-label">{{ step }}</span>
        </li>
      }
    </ol>
  `,
  styles: [
    `
      .fx-wiz {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        list-style: none;
        margin: 0 0 var(--space-5);
        padding: 0;
      }

      .fx-wiz-step {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        flex: 1;
        min-width: 0;
        color: var(--color-text-secondary);
        font-size: 0.82rem;
      }

      /* The connecting rule reads as progress, so it only precedes a step
         that is not the first. */
      .fx-wiz-step + .fx-wiz-step::before {
        content: "";
        flex: 1;
        height: 1px;
        background: var(--color-border);
      }

      .fx-wiz-dot {
        display: grid;
        place-items: center;
        width: 1.55rem;
        height: 1.55rem;
        flex-shrink: 0;
        border-radius: 50%;
        border: 1px solid var(--color-border);
        font-size: 0.75rem;
        font-variant-numeric: tabular-nums;
      }

      .is-current > .fx-wiz-dot {
        border-color: var(--color-primary);
        background: var(--color-primary);
        color: #fff;
      }

      .is-done > .fx-wiz-dot {
        border-color: var(--color-success);
        color: var(--color-success);
      }

      .is-current { color: var(--color-text); font-weight: 600; }

      /* Under a phone the labels crowd the dots out; the current step's own
         heading already says where you are. */
      @media (max-width: 480px) {
        .fx-wiz-label { display: none; }
      }
    `,
  ],
})
export class WizardStepsComponent {
  @Input({ required: true }) steps: string[] = [];
  @Input({ required: true }) current = 0;
  @Input() label = "";
}
