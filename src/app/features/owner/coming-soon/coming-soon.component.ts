import { Component } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";

// Landing spot for nav entries that are on the menu (RH/Répertoires) before
// the feature behind them exists — keeps every link in the header navigable
// instead of a dead end, while being honest that there's nothing here yet.
@Component({
  selector: "app-coming-soon",
  standalone: true,
  imports: [TranslateModule, EmptyStateComponent],
  template: `
    <div class="fx-page">
      <header class="fx-page-header">
        <div class="fx-page-header-titles">
          <h1 class="fx-page-header-title">{{ titleKey | translate }}</h1>
        </div>
      </header>
      <div class="app-card">
        <div class="app-card-body">
          <app-empty-state [title]="'coming_soon.title' | translate" [body]="'coming_soon.body' | translate" icon="bi-hourglass-split" />
        </div>
      </div>
    </div>
  `,
})
export class ComingSoonComponent {
  readonly titleKey: string;

  constructor(route: ActivatedRoute) {
    this.titleKey = (route.snapshot.data["titleKey"] as string) ?? "coming_soon.title";
  }
}
