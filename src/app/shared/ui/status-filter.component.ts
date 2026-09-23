import { Component, EventEmitter, Input, Output } from "@angular/core";

export interface StatusFilterOption {
  value: string;
  label: string;
  count: number;
  /** CSS colour of the row's strip — the same hue the table rows use. */
  color: string;
}

/**
 * The status filter: one pill per state, each carrying how many rows match.
 *
 * The count is on the pill because you pick "the 4 overdue" already knowing
 * there are 4 — a filter that hides its own size makes you click to find
 * out whether it was worth clicking.
 *
 * Radios, not buttons: picking a status is picking one of a set, and screen
 * readers and the keyboard get that for free. The input is visually hidden
 * and the label is the pill, so the semantics survive the styling.
 */
@Component({
  selector: "app-status-filter",
  standalone: true,
  template: `
    <fieldset class="fx-chips">
      <legend class="fx-chips-legend">{{ legend }}</legend>
      @for (opt of options; track opt.value) {
        <input
          type="radio"
          class="fx-chip-input"
          [id]="name + '-' + opt.value"
          [name]="name"
          [value]="opt.value"
          [checked]="opt.value === value"
          (change)="valueChange.emit(opt.value)"
        />
        <label class="fx-chip" [for]="name + '-' + opt.value" [style.--fx-chip-color]="opt.color">
          {{ opt.label }}
          <span class="fx-chip-count">{{ opt.count }}</span>
        </label>
      }
    </fieldset>
  `,
})
export class StatusFilterComponent {
  @Input() legend = "";
  @Input() name = "status";
  @Input() value = "";
  @Input() options: StatusFilterOption[] = [];
  @Output() valueChange = new EventEmitter<string>();
}
