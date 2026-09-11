import { Component } from "@angular/core";
import { ToastService } from "../../core/services/toast.service";

@Component({
  selector: "app-toast-container",
  standalone: true,
  template: `
    <div class="toast-stack" role="status" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast-item toast-item--{{ toast.kind }}">
          <i class="bi" [class.bi-check-circle-fill]="toast.kind === 'success'"
             [class.bi-x-circle-fill]="toast.kind === 'error'"
             [class.bi-info-circle-fill]="toast.kind === 'info'"
             [class.bi-exclamation-triangle-fill]="toast.kind === 'warning'"></i>
          <span>{{ toast.message }}</span>
          <button type="button" class="toast-close" (click)="toastService.dismiss(toast.id)" aria-label="Close">
            <i class="bi bi-x"></i>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-stack {
      position: fixed;
      top: 1rem;
      inset-inline-end: 1rem;
      z-index: 2000;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: min(360px, calc(100vw - 2rem));
    }
    .toast-item {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-inline-start: 4px solid var(--color-info);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-md);
      padding: 0.75rem 1rem;
      color: var(--color-text);
      font-size: 0.9rem;
      animation: slide-in var(--transition-base);
    }
    .toast-item--success { border-inline-start-color: var(--color-success); }
    .toast-item--success i { color: var(--color-success); }
    .toast-item--error { border-inline-start-color: var(--color-danger); }
    .toast-item--error i { color: var(--color-danger); }
    .toast-item--warning { border-inline-start-color: var(--color-warning); }
    .toast-item--warning i { color: var(--color-warning); }
    .toast-item--info i { color: var(--color-info); }
    .toast-close {
      margin-inline-start: auto;
      background: none;
      border: none;
      color: var(--color-muted);
      cursor: pointer;
      line-height: 1;
    }
    @keyframes slide-in {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
})
export class ToastContainerComponent {
  constructor(public readonly toastService: ToastService) {}
}
