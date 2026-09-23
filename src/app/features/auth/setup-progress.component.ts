import { Component, DestroyRef, Input, OnInit, inject, signal } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";

/** The three things that happen between the click and naming the gym. */
const STEPS = ["auth.setup_step_email", "auth.setup_step_account", "auth.setup_step_gym"];

/**
 * "Nous préparons votre salle" — shown once the address is confirmed, while
 * the screen waits to hand over to /owner/setup-company.
 *
 * The first line is already true when it appears; the other two tick over
 * across `duration`, the last one just before the page moves on. It is the
 * parent that moves on: this only shows it coming.
 */
@Component({
  selector: "app-setup-progress",
  standalone: true,
  imports: [TranslateModule],
  template: `
    <ol class="sp" role="status" aria-live="polite">
      @for (key of steps; track key; let i = $index) {
        <li [attr.data-state]="stateOf(i)">
          <span class="sp-icon" aria-hidden="true">
            @switch (stateOf(i)) {
              @case ("done") { <i class="bi bi-check-lg"></i> }
              @case ("active") { <span class="sp-spin"></span> }
            }
          </span>
          {{ key | translate }}
        </li>
      }
    </ol>
  `,
  styleUrl: "./setup-progress.component.scss",
})
export class SetupProgressComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  /** How long the whole sequence takes, in ms — the parent's wait. */
  @Input() duration = 3600;

  readonly steps = STEPS;
  /** Index of the step in progress; every step before it is done. */
  readonly current = signal(1);

  ngOnInit(): void {
    const timers = [
      setTimeout(() => this.current.set(2), this.duration * 0.35),
      setTimeout(() => this.current.set(3), this.duration * 0.85),
    ];
    this.destroyRef.onDestroy(() => timers.forEach(clearTimeout));
  }

  stateOf(i: number): "done" | "active" | "todo" {
    if (i < this.current()) return "done";
    return i === this.current() ? "active" : "todo";
  }
}
