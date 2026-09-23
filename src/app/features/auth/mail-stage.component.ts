import { Component, Input } from "@angular/core";

/** Where the confirmation link stands, as the picture shows it. */
export type MailStageState = "waiting" | "sending" | "confirmed" | "error";

/**
 * The envelope above the "check your inbox" and "address confirmed" screens.
 *
 * Purely decorative (aria-hidden): every state it draws is also said in
 * words beside it. Four states —
 *
 *   waiting   — floats, the letter peeks out, two rings pulse: we are
 *               listening for the click.
 *   sending   — flies off and a fresh one drops in: a new link went out.
 *   confirmed — gives way to a check that draws itself, with a small burst.
 *   error     — greys out and shakes once: the link did not work.
 *
 * Each animation starts from its first frame and ends on the resting look,
 * so with reduced motion the final picture is simply there.
 */
@Component({
  selector: "app-mail-stage",
  standalone: true,
  template: `
    <div class="ms" [attr.data-state]="state" aria-hidden="true">
      @if (state === "waiting") {
        <span class="ms-ring"></span>
        <span class="ms-ring ms-ring--late"></span>
      }

      <svg class="ms-envelope" viewBox="0 0 120 96" fill="none">
        <rect class="ms-back" x="8" y="34" width="104" height="58" rx="10" />
        <path class="ms-flap" d="M8 44 L52 14 Q60 9 68 14 L112 44 Z" />
        <g class="ms-letter">
          <rect class="ms-paper" x="22" y="18" width="76" height="56" rx="6" />
          <rect class="ms-line ms-line--strong" x="32" y="30" width="40" height="5" rx="2.5" />
          <rect class="ms-line" x="32" y="41" width="56" height="4" rx="2" />
          <rect class="ms-line" x="32" y="50" width="46" height="4" rx="2" />
        </g>
        <path class="ms-front" d="M8 50 L60 76 L112 50 V82 Q112 92 102 92 H18 Q8 92 8 82 Z" />
      </svg>

      @if (state === "confirmed") {
        <span class="ms-check">
          <svg viewBox="0 0 52 52"><path class="ms-check-path" d="M15 27 L23 35 L38 18" /></svg>
        </span>
        @for (i of particles; track i) {
          <span class="ms-dot" [style.--i]="i"></span>
        }
      }
    </div>
  `,
  styleUrl: "./mail-stage.component.scss",
})
export class MailStageComponent {
  @Input() state: MailStageState = "waiting";

  readonly particles = Array.from({ length: 12 }, (_, i) => i);
}
