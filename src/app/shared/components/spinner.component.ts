import { Component, Input } from "@angular/core";

@Component({
  selector: "app-spinner",
  standalone: true,
  template: `<span class="app-spinner" [style.width.px]="size" [style.height.px]="size" role="status" aria-label="Loading"></span>`,
  styles: [`
    .app-spinner {
      display: inline-block;
      border: 2.5px solid var(--color-border);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class SpinnerComponent {
  @Input() size = 20;
}
