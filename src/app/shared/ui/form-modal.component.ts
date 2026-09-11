import { A11yModule } from "@angular/cdk/a11y";
import { Component, EventEmitter, HostListener, Input, Output } from "@angular/core";

/**
 * Centered two-column modal for a create/edit form whose first field is a
 * photo (suppliers so far, see the directories
 * features) — the photo becomes a real panel, with the name reflected
 * live underneath it as it's typed, instead of one more field stacked
 * above the rest. Distinct from the generic app-modal and the app-drawer
 * used everywhere else in the app, which are unaffected by this.
 */
@Component({
  selector: "app-form-modal",
  standalone: true,
  imports: [ A11yModule ],
  template: `
    @if (open) {
      <!-- Backdrop: mouse-only dismiss; Escape (see the host listener below) is the keyboard equivalent. -->
      <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
      <div class="fx-fm-backdrop" (click)="closed.emit()">
        <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events -->
        <div
          class="fx-fm"
          cdkTrapFocus
          cdkTrapFocusAutoCapture
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="title"
          (click)="$event.stopPropagation()"
        >
          <div class="fx-fm-photo">
            <label class="fx-fm-photo-drop" [class.is-invalid]="photoError" for="fx-fm-photo-input">
              @if (photoPreview) {
                <img [src]="photoPreview" alt="" />
              } @else {
                <i class="bi" [class]="photoIcon"></i>
              }
            </label>
            <input
              id="fx-fm-photo-input"
              type="file"
              class="visually-hidden"
              [attr.accept]="accept"
              (change)="photoSelected.emit($event)"
            />
            <div class="fx-fm-photo-live" [class.is-placeholder]="!namePreview">{{ namePreview || "—" }}</div>
            @if (photoHint) {
              <div class="fx-fm-photo-hint">{{ photoHint }}</div>
            }
            @if (photoError) {
              <div class="fx-fm-photo-error">{{ photoError }}</div>
            }
          </div>

          <div class="fx-fm-main">
            <header class="fx-fm-head">
              <h2>{{ title }}</h2>
              <button type="button" class="icon-btn" (click)="closed.emit()" aria-label="Close">
                <i class="bi bi-x-lg"></i>
              </button>
            </header>
            <div class="fx-fm-body">
              <ng-content></ng-content>
            </div>
            <footer class="fx-fm-footer">
              <ng-content select="[modal-footer]"></ng-content>
            </footer>
          </div>
        </div>
      </div>
    }
  `,
  styles: [ `
    .fx-fm-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 12, 26, 0.5);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      z-index: var(--z-modal);
      padding: 3rem 1rem;
      overflow-y: auto;
      animation: fx-fm-fade var(--transition-base);
    }

    .fx-fm {
      width: 100%;
      max-width: 700px;
      background: var(--color-surface);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
      overflow: hidden;
      display: grid;
      grid-template-columns: 240px 1fr;
      animation: fx-fm-in var(--transition-base);
    }

    // ---- Left panel — the photo is the identity, not a form field -------
    .fx-fm-photo {
      background: var(--color-surface-sunken);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      padding: 2rem 1.25rem;
      text-align: center;
    }
    .fx-fm-photo-drop {
      width: 116px;
      height: 116px;
      border-radius: var(--radius-lg);
      border: 2px dashed var(--color-primary-border);
      background: var(--color-surface);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-primary);
      font-size: 2rem;
      cursor: pointer;
      overflow: hidden;
      transition: border-color var(--transition-fast), transform var(--transition-fast);

      img { width: 100%; height: 100%; object-fit: cover; }
      &:hover { border-color: var(--color-primary); transform: scale(1.02); }
      &.is-invalid { border-color: var(--color-danger); color: var(--color-danger); }
    }
    .fx-fm-photo-live {
      margin-top: 0.3rem;
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 1rem;
      color: var(--color-text);
      line-height: 1.25;
      text-wrap: balance;
      overflow-wrap: anywhere;

      &.is-placeholder { color: var(--color-muted); font-weight: 500; font-family: var(--font-family); font-size: var(--font-size-sm); }
    }
    .fx-fm-photo-hint { font-size: var(--font-size-xs); color: var(--color-muted); max-width: 15ch; line-height: 1.4; }
    .fx-fm-photo-error { font-size: var(--font-size-xs); color: var(--color-danger); font-weight: 600; max-width: 16ch; line-height: 1.4; }

    // ---- Right column — the actual form, scrolls on its own -------------
    .fx-fm-main { display: flex; flex-direction: column; max-height: 82vh; min-width: 0; }
    .fx-fm-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1.15rem 1.4rem;
      border-bottom: 1px solid var(--color-border);
      flex: 0 0 auto;

      h2 { font-family: var(--font-display); font-size: 1.05rem; font-weight: 700; margin: 0; }
    }
    .fx-fm-body { padding: 1.3rem 1.4rem; overflow-y: auto; flex: 1 1 auto; }
    .fx-fm-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.6rem;
      padding: 1rem 1.4rem;
      border-top: 1px solid var(--color-border);
      flex: 0 0 auto;
    }

    @keyframes fx-fm-fade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes fx-fm-in {
      from { opacity: 0; transform: translateY(-12px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @media (prefers-reduced-motion: reduce) {
      .fx-fm-backdrop, .fx-fm { animation: none; }
    }

    // ---- Narrow viewport — photo panel folds into a horizontal strip ----
    @media (max-width: 640px) {
      .fx-fm-backdrop { padding: 0; align-items: stretch; }
      .fx-fm { max-width: none; min-height: 100%; border-radius: 0; grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
      .fx-fm-photo { flex-direction: row; padding: 0.85rem 1.4rem; justify-content: flex-start; }
      .fx-fm-photo-drop { width: 52px; height: 52px; font-size: 1.2rem; flex: 0 0 auto; }
      .fx-fm-photo-live, .fx-fm-photo-hint, .fx-fm-photo-error { display: none; }
      .fx-fm-main { max-height: none; }
    }
  ` ],
})
export class FormModalComponent {
  @Input() open = false;
  @Input() title = "";
  @Input() photoPreview: string | null = null;
  @Input() photoError: string | null = null;
  @Input() photoHint = "";
  @Input() photoIcon = "bi-camera";
  @Input() accept = "image/jpeg,image/png,image/webp";
  /** The form's live name value, shown under the photo as it's typed. */
  @Input() namePreview = "";
  @Output() closed = new EventEmitter<void>();
  @Output() photoSelected = new EventEmitter<Event>();

  @HostListener("document:keydown.escape")
  onEsc(): void {
    if (this.open) this.closed.emit();
  }
}
