import { A11yModule } from "@angular/cdk/a11y";
import { Component, EventEmitter, HostListener, Input, Output } from "@angular/core";

/**
 * Right-side drawer for create/edit workflows. Same contract as app-modal
 * (`[open]`, `[title]`, `(close)`) plus an optional `[description]` and a
 * `[drawer-footer]` projection slot for the action buttons.
 */
@Component({
  selector: "app-drawer",
  standalone: true,
  imports: [A11yModule],
  template: `
    @if (open) {
      <!-- Backdrop: mouse-only dismiss; Escape (see the host listener below) is the keyboard equivalent. -->
      <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
      <div class="fx-drawer-backdrop" (click)="closed.emit()"></div>
      <aside
        class="fx-drawer"
        [class.fx-drawer--wide]="wide"
        cdkTrapFocus
        cdkTrapFocusAutoCapture
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="title"
      >
        <header class="fx-drawer-header">
          <div>
            <h2 class="fx-drawer-title">{{ title }}</h2>
            @if (description) { <p class="fx-drawer-desc">{{ description }}</p> }
          </div>
          <button type="button" class="icon-btn" (click)="closed.emit()" aria-label="Close">
            <i class="bi bi-x-lg"></i>
          </button>
        </header>

        <div class="fx-drawer-body">
          <ng-content></ng-content>
        </div>

        <footer class="fx-drawer-footer">
          <ng-content select="[drawer-footer]"></ng-content>
        </footer>
      </aside>
    }
  `,
})
export class DrawerComponent {
  @Input() open = false;
  @Input() title = "";
  @Input() description = "";
  @Input() wide = false;
  @Output() closed = new EventEmitter<void>();

  @HostListener("document:keydown.escape")
  onEsc(): void {
    if (this.open) this.closed.emit();
  }
}
