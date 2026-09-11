import { Component, Input } from "@angular/core";

/**
 * Consistent page header: large title, muted one-line description, and a
 * right-aligned actions slot (project buttons via <app-page-header>…</app-page-header>).
 */
@Component({
  selector: "app-page-header",
  standalone: true,
  template: `
    <header class="fx-page-header">
      <div class="fx-page-header-titles">
        <h1 class="fx-page-header-title">{{ title }}</h1>
        @if (description) {
          <p class="fx-page-header-desc">{{ description }}</p>
        }
      </div>
      <div class="fx-page-header-actions">
        <ng-content></ng-content>
      </div>
    </header>
  `,
})
export class PageHeaderComponent {
  @Input() title = "";
  @Input() description = "";
}
