import { Component, EventEmitter, Input, Output } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";

/**
 * Friendly, consistent load-failure state with a retry button.
 * Never surfaces a raw API error string.
 */
@Component({
  selector: "app-error-state",
  standalone: true,
  imports: [TranslateModule],
  template: `
    <div class="fx-state fx-state--danger" role="alert">
      <div class="fx-state-icon"><i class="bi bi-exclamation-triangle"></i></div>
      <p class="fx-state-title">{{ title || ("common.error_generic" | translate) }}</p>
      @if (body) { <p class="fx-state-body">{{ body }}</p> }
      @if (showRetry) {
        <button type="button" class="btn btn-outline-secondary btn-sm" (click)="retry.emit()">
          <i class="bi bi-arrow-clockwise"></i> {{ "common.retry" | translate }}
        </button>
      }
    </div>
  `,
})
export class ErrorStateComponent {
  @Input() title = "";
  @Input() body = "";
  @Input() showRetry = true;
  @Output() retry = new EventEmitter<void>();
}
