import { Component, EventEmitter, HostListener, Input, Output, signal } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";

/**
 * Left rail chrome for list pages — header + reset + result count, then the
 * page's own filter controls projected via <ng-content>. On < 992px it becomes
 * a slide-over toggled by the "Filtres" button.
 */
@Component({
  selector: "app-filter-rail",
  standalone: true,
  imports: [TranslateModule],
  templateUrl: "./filter-rail.component.html",
  styleUrl: "./filter-rail.component.scss",
})
export class FilterRailComponent {
  @Input() total: number | null = null;
  @Input() hasFilters = false;
  @Output() reset = new EventEmitter<void>();

  readonly mobileOpen = signal(false);

  @HostListener("document:keydown.escape")
  onEsc(): void {
    this.mobileOpen.set(false);
  }
}
