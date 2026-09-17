import { Component, EventEmitter, Input, Output } from "@angular/core";

export interface StatusFilterOption {
  value: string;
  label: string;
  count: number;
  /** CSS colour of the row's strip — the same hue the table rows use. */
  color: string;
}

/**
 * The rail's status list: a colour strip, the label, how many rows match,
 * and a radio. Radios (not buttons) because picking a status is picking one
 * of a set — screen readers and the keyboard get that for free.
 */
@Component({
  selector: "app-status-filter",
  standalone: true,
  template: `
    <fieldset class="fx-rail-group">
      <legend class="fx-rail-legend">{{ legend }}</legend>
      @for (opt of options; track opt.value) {
        <div class="fx-rail-status" [class.is-active]="opt.value === value">
          <span class="fx-rail-status-strip" [style.background]="opt.color"></span>
          <label [for]="name + '-' + opt.value">{{ opt.label }}</label>
          <span class="fx-rail-status-count">{{ opt.count }}</span>
          <input
            type="radio"
            [id]="name + '-' + opt.value"
            [name]="name"
            [value]="opt.value"
            [checked]="opt.value === value"
            (change)="valueChange.emit(opt.value)"
          />
        </div>
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
