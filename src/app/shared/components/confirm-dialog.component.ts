import { A11yModule } from "@angular/cdk/a11y";
import { Component, HostListener } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { ConfirmService } from "../../core/services/confirm.service";

@Component({
  selector: "app-confirm-dialog",
  standalone: true,
  imports: [A11yModule, TranslateModule],
  template: `
    @if (confirmService.request(); as req) {
      <!-- Backdrop: mouse-only dismiss; Escape (see the host listener below) is the keyboard equivalent. -->
      <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
      <div class="confirm-backdrop" (click)="confirmService.resolve(false)">
        <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events -->
        <div class="confirm-dialog" cdkTrapFocus cdkTrapFocusAutoCapture role="alertdialog" aria-modal="true"
             [attr.aria-label]="req.title" (click)="$event.stopPropagation()">
          <h3>{{ req.title }}</h3>
          <p>{{ req.body }}</p>
          <div class="confirm-actions">
            <button type="button" class="btn btn-outline-secondary" (click)="confirmService.resolve(false)">
              {{ req.cancelLabel || ("common.cancel" | translate) }}
            </button>
            <button type="button" class="btn" [class.btn-danger]="req.danger" [class.btn-primary]="!req.danger"
                    (click)="confirmService.resolve(true)">
              {{ req.confirmLabel || ("common.confirm" | translate) }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .confirm-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2100;
      padding: 1rem;
    }
    .confirm-dialog {
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
      padding: 1.5rem;
      max-width: 400px;
      width: 100%;
    }
    .confirm-dialog h3 {
      margin: 0 0 0.5rem;
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--color-text);
    }
    .confirm-dialog p {
      margin: 0 0 1.25rem;
      color: var(--color-text-secondary);
      font-size: 0.9rem;
    }
    .confirm-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
  `],
})
export class ConfirmDialogComponent {
  constructor(public readonly confirmService: ConfirmService) {}

  @HostListener("document:keydown.escape")
  onEsc(): void {
    if (this.confirmService.request()) this.confirmService.resolve(false);
  }
}
