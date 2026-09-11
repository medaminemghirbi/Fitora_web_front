import { Component, EventEmitter, Input, Output } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { PageMeta } from "../../core/services/sessions.service";

@Component({
  selector: "app-pagination",
  standalone: true,
  imports: [TranslateModule],
  template: `
    @if (meta) {
      <div class="app-pagination">
        <span class="app-pagination-count">{{ meta.total }} {{ unit | translate }}</span>
        @if (meta.total_pages > 1) {
          <div class="app-pagination-controls">
            <span class="text-muted-token">
              {{ "common.page" | translate }} {{ meta.page }} {{ "common.of" | translate }} {{ meta.total_pages }}
            </span>
            <button type="button" class="btn btn-outline-secondary btn-sm" [disabled]="meta.page <= 1"
                    (click)="pageChange.emit(meta.page - 1)">
              <i class="bi bi-chevron-left"></i>
            </button>
            <button type="button" class="btn btn-outline-secondary btn-sm" [disabled]="meta.page >= meta.total_pages"
                    (click)="pageChange.emit(meta.page + 1)">
              <i class="bi bi-chevron-right"></i>
            </button>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .app-pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem var(--space-5, 1.5rem);
      font-size: 0.85rem;
    }
    .app-pagination-count {
      color: var(--color-text-secondary);
      font-weight: 500;
      font-variant-numeric: tabular-nums;
    }
    .app-pagination-controls {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  `],
})
export class PaginationComponent {
  @Input() meta: PageMeta | null = null;
  /** i18n key for the noun after the count ("42 results"). */
  @Input() unit = "common.results";
  @Output() pageChange = new EventEmitter<number>();
}
