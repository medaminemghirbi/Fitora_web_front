import { Component } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { ActivitiesComponent } from "../activities/activities.component";
import { PlansComponent } from "../plans/plans.component";

/**
 * What the gym sells: the plans, and the activities they are priced for.
 *
 * These were two pages, reached from two menu entries, and an admin setting
 * up a new plan had to walk between them. But a price does not belong to a
 * plan or to an activity — it only exists where the two cross, so the pair
 * has to be readable at once.
 *
 * Composed rather than merged: each half keeps its own forms, modals and
 * specs, and this page only decides that they sit side by side. Merging them
 * into one component would have produced exactly the kind of giant screen
 * the rest of this work is undoing.
 */
@Component({
  selector: "app-catalogue",
  standalone: true,
  imports: [TranslateModule, PlansComponent, ActivitiesComponent],
  templateUrl: "./catalogue.component.html",
  styleUrl: "./catalogue.component.scss",
})
export class CatalogueComponent {}
