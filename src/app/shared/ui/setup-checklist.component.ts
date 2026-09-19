import { Component, EventEmitter, Input, Output } from "@angular/core";
import { RouterLink } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { SetupState } from "../../core/configuration/configuration.service";

interface Step {
  key: keyof Pick<SetupState, "activity" | "contract_type" | "coach">;
  labelKey: string;
  descKey: string;
  route: string;
  icon: string;
}

const STEPS: Step[] = [
  { key: "activity", labelKey: "getting_started.step_activity", descKey: "getting_started.step_activity_desc", route: "/owner/catalogue", icon: "bi-lightning-charge" },
  { key: "contract_type", labelKey: "getting_started.step_contract_type", descKey: "getting_started.step_contract_type_desc", route: "/owner/catalogue", icon: "bi-card-checklist" },
  { key: "coach", labelKey: "getting_started.step_coach", descKey: "getting_started.step_coach_desc", route: "/owner/team", icon: "bi-person-badge" },
];

// Presentational "Premiers pas" checklist. Step completion is derived from
// data server-side (SetupState); this only renders it and emits `dismiss`.
@Component({
  selector: "app-setup-checklist",
  standalone: true,
  imports: [RouterLink, TranslateModule],
  template: `
    <div class="sc" [class.sc-compact]="compact">
      <div class="sc-head">
        <div>
          <p class="sc-progress">{{ "getting_started.progress" | translate: { done: doneCount(), total: steps.length } }}</p>
          <div class="sc-bar"><span [style.width.%]="(doneCount() / steps.length) * 100"></span></div>
        </div>
        @if (dismissable) {
          <button type="button" class="sc-skip" (click)="dismiss.emit()">{{ "getting_started.skip" | translate }}</button>
        }
      </div>

      <ol class="sc-list">
        @for (step of steps; track step.key) {
          <li class="sc-item" [class.sc-done]="setup?.[step.key]">
            <span class="sc-check">
              @if (setup?.[step.key]) {
                <i class="bi bi-check-lg"></i>
              } @else {
                <i [class]="'bi ' + step.icon"></i>
              }
            </span>
            <div class="sc-text">
              <p class="sc-label">{{ step.labelKey | translate }}</p>
              <p class="sc-desc">{{ step.descKey | translate }}</p>
            </div>
            @if (setup?.[step.key]) {
              <span class="sc-status">{{ "getting_started.done" | translate }}</span>
            } @else {
              <a [routerLink]="step.route" class="sc-cta">{{ "getting_started.action" | translate }} <i class="bi bi-arrow-right"></i></a>
            }
          </li>
        }
      </ol>
    </div>
  `,
  styles: [
    `
      .sc {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .sc-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
      }
      .sc-head > div {
        flex: 1;
      }
      .sc-progress {
        margin: 0 0 0.5rem;
        font-weight: 600;
        font-size: 0.9rem;
        color: var(--color-text, #1e293b);
      }
      .sc-bar {
        height: 6px;
        border-radius: 999px;
        background: rgba(148, 163, 184, 0.25);
        overflow: hidden;
      }
      .sc-bar span {
        display: block;
        height: 100%;
        border-radius: 999px;
        background: var(--brand-gradient, linear-gradient(112deg, #6946aa, #e8005f 54%, #ffbc00 108%));
        transition: width 0.4s ease;
      }
      .sc-skip {
        border: 0;
        background: none;
        color: #64748b;
        font-size: 0.85rem;
        cursor: pointer;
        padding: 0.25rem 0.4rem;
        white-space: nowrap;
      }
      .sc-skip:hover {
        color: #1e293b;
        text-decoration: underline;
      }
      .sc-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
      }
      .sc-item {
        display: flex;
        align-items: center;
        gap: 0.9rem;
        padding: 0.9rem 1rem;
        border: 1px solid rgba(148, 163, 184, 0.28);
        border-radius: 14px;
        background: #fff;
      }
      .sc-compact .sc-item {
        padding: 0.7rem 0.85rem;
      }
      .sc-check {
        flex: none;
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: rgba(74, 42, 143, 0.1);
        color: #4a2a8f;
        font-size: 1rem;
      }
      .sc-done .sc-check {
        background: #16a34a;
        color: #fff;
      }
      .sc-text {
        flex: 1;
        min-width: 0;
      }
      .sc-label {
        margin: 0;
        font-weight: 600;
        font-size: 0.95rem;
        color: #1e293b;
      }
      .sc-done .sc-label {
        text-decoration: line-through;
        color: #64748b;
      }
      .sc-desc {
        margin: 0.15rem 0 0;
        font-size: 0.82rem;
        color: #64748b;
      }
      .sc-compact .sc-desc {
        display: none;
      }
      .sc-status {
        flex: none;
        font-size: 0.8rem;
        font-weight: 600;
        color: #16a34a;
      }
      .sc-cta {
        flex: none;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.85rem;
        font-weight: 600;
        color: #e8005f;
        text-decoration: none;
        white-space: nowrap;
      }
      .sc-cta:hover {
        text-decoration: underline;
      }
      @media (max-width: 560px) {
        .sc-item {
          flex-wrap: wrap;
        }
        .sc-cta,
        .sc-status {
          margin-left: calc(34px + 0.9rem);
        }
      }
    `,
  ],
})
export class SetupChecklistComponent {
  @Input() setup: SetupState | null = null;
  @Input() compact = false;
  @Input() dismissable = true;
  @Output() dismiss = new EventEmitter<void>();

  readonly steps = STEPS;

  doneCount(): number {
    const s = this.setup;
    return s ? STEPS.filter((st) => s[st.key]).length : 0;
  }
}
