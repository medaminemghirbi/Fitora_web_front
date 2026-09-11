import { Component, Input } from "@angular/core";

export type KpiTone = "primary" | "success" | "warning" | "danger" | "info";

/**
 * Compact KPI/metric card — small icon, label, big value, optional trend.
 * Only ever fed real data by the caller; never invents statistics.
 */
@Component({
  selector: "app-kpi-card",
  standalone: true,
  template: `
    <div class="fx-kpi fx-kpi--{{ tone }}">
      <div class="fx-kpi-head">
        @if (icon) { <span class="fx-kpi-icon"><i class="bi" [class]="icon"></i></span> }
        <span>{{ label }}</span>
      </div>
      <div class="fx-kpi-value">{{ value }}</div>
      @if (trend) {
        <div class="fx-kpi-trend fx-kpi-trend--{{ trendDirection }}">
          @if (trendDirection === 'up') { <i class="bi bi-arrow-up-short"></i> }
          @else if (trendDirection === 'down') { <i class="bi bi-arrow-down-short"></i> }
          {{ trend }}
        </div>
      }
    </div>
  `,
})
export class KpiCardComponent {
  @Input() label = "";
  @Input() value: string | number = "";
  @Input() icon = "";
  @Input() tone: KpiTone = "primary";
  @Input() trend = "";
  @Input() trendDirection: "up" | "down" | "flat" = "flat";
}
