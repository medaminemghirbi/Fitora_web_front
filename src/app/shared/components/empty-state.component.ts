import { Component, Input } from "@angular/core";

@Component({
  selector: "app-empty-state",
  standalone: true,
  template: `
    <div class="fx-state">
      <div class="fx-state-icon"><i class="bi" [class]="icon"></i></div>
      <p class="fx-state-title">{{ title }}</p>
      @if (body) { <p class="fx-state-body">{{ body }}</p> }
      <ng-content></ng-content>
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() title = "";
  @Input() body = "";
  @Input() icon = "bi-inbox";
}
