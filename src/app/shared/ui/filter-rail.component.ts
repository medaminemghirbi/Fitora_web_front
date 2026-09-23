import { Component, Input, signal } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";

/**
 * The left filter column of a list page (search, export, status, selects).
 *
 * Desktop: a flush column against the top bar, as wide as the design's rail.
 * Below lg it collapses behind a "Filtres" button so the table keeps the
 * whole width on a phone — the projected content is the same in both cases.
 */
@Component({
  selector: "app-filter-rail",
  standalone: true,
  imports: [TranslateModule],
  template: `
    <button type="button" class="fx-rail-toggle d-lg-none" (click)="open.set(!open())" [attr.aria-expanded]="open()">
      <i class="bi bi-funnel"></i>
      {{ "common.filters" | translate }}
      @if (activeCount > 0) {
        <span class="fx-rail-toggle-count">{{ activeCount }}</span>
      }
      <i class="bi" [class.bi-chevron-down]="!open()" [class.bi-chevron-up]="open()"></i>
    </button>
    <aside class="fx-rail" [class.is-open]="open()" [attr.aria-label]="'common.filters' | translate">
      <ng-content></ng-content>
    </aside>
  `,
})
export class FilterRailComponent {
  /** Shown on the mobile toggle so a collapsed rail still says it is filtering. */
  @Input() activeCount = 0;

  readonly open = signal(false);
}
