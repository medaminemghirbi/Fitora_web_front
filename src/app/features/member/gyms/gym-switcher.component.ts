import { Component, EventEmitter, Output } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { GymsService } from "../../../core/services/gyms.service";

/**
 * Which gym the member screens are showing. "All my gyms" is a first-class
 * choice, not a fallback: someone training in two places wants one week, not
 * two apps. Hidden entirely for a person with a single gym — there would be
 * nothing to choose.
 */
@Component({
  selector: "app-gym-switcher",
  standalone: true,
  imports: [TranslateModule],
  template: `
    @if (gyms.mine().length > 1) {
      <nav class="fx-gym-switcher" [attr.aria-label]="'member.gyms.title' | translate">
        <button
          type="button"
          class="fx-gym-chip"
          [class.is-active]="gyms.selectedId() === null"
          (click)="pick(null)"
        >
          {{ "member.gyms.all" | translate }}
        </button>
        @for (gym of gyms.mine(); track gym.id) {
          <button
            type="button"
            class="fx-gym-chip"
            [class.is-active]="gyms.selectedId() === gym.id"
            (click)="pick(gym.id)"
          >
            <span class="fx-gym-chip-dot" [style.background]="gym.primary_color || 'var(--color-primary)'"></span>
            {{ gym.name }}
          </button>
        }
      </nav>
    }
  `,
})
export class GymSwitcherComponent {
  @Output() readonly changed = new EventEmitter<string | null>();

  constructor(readonly gyms: GymsService) {}

  pick(gymId: string | null): void {
    this.gyms.select(gymId);
    this.changed.emit(gymId);
  }
}
