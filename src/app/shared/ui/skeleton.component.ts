import { Component, Input } from "@angular/core";

/**
 * Shimmer placeholder. Use `variant` for common shapes, or set width/height.
 *   <app-skeleton variant="table" [rows]="6" [cols]="5" />
 *   <app-skeleton variant="cards" [count]="4" />
 *   <app-skeleton width="60%" />
 */
@Component({
  selector: "app-skeleton",
  standalone: true,
  template: `
    @switch (variant) {
      @case ("table") {
        <div class="fx-skeleton-table" aria-hidden="true">
          <div class="fx-skeleton-table-row fx-skeleton-table-row--head">
            @for (c of colsArray; track $index) { <span class="fx-skeleton fx-skeleton--text"></span> }
          </div>
          @for (r of rowsArray; track $index) {
            <div class="fx-skeleton-table-row">
              @for (c of colsArray; track $index) { <span class="fx-skeleton fx-skeleton--text"></span> }
            </div>
          }
        </div>
      }
      @case ("cards") {
        <div class="fx-skeleton-cards" aria-hidden="true">
          @for (i of countArray; track $index) {
            <div class="fx-skeleton-card">
              <span class="fx-skeleton fx-skeleton--circle" style="width:44px;height:44px"></span>
              <span class="fx-skeleton fx-skeleton--text" style="width:70%"></span>
              <span class="fx-skeleton fx-skeleton--text" style="width:45%"></span>
            </div>
          }
        </div>
      }
      @case ("kpi") {
        <div class="fx-kpi-grid" aria-hidden="true">
          @for (i of countArray; track $index) {
            <div class="fx-kpi">
              <span class="fx-skeleton fx-skeleton--text" style="width:50%"></span>
              <span class="fx-skeleton fx-skeleton--text" style="width:35%;height:1.6rem"></span>
            </div>
          }
        </div>
      }
      @default {
        <span class="fx-skeleton fx-skeleton--text" [style.width]="width" [style.height]="height" aria-hidden="true"></span>
      }
    }
  `,
  styles: [`
    :host { display: block; }
    .fx-skeleton-table { border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; }
    .fx-skeleton-table-row {
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: 1fr;
      gap: 1.5rem;
      padding: 0.95rem 1rem;
      border-bottom: 1px solid var(--color-border);
    }
    .fx-skeleton-table-row:last-child { border-bottom: 0; }
    .fx-skeleton-table-row--head { background: var(--color-surface-sunken); }
    .fx-skeleton-cards { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
    .fx-skeleton-card {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }
  `],
})
export class SkeletonComponent {
  @Input() variant: "line" | "table" | "cards" | "kpi" = "line";
  @Input() width = "100%";
  @Input() height = "0.85rem";
  @Input() rows = 5;
  @Input() cols = 4;
  @Input() count = 4;

  get rowsArray(): number[] { return Array.from({ length: this.rows }); }
  get colsArray(): number[] { return Array.from({ length: this.cols }); }
  get countArray(): number[] { return Array.from({ length: this.count }); }
}
