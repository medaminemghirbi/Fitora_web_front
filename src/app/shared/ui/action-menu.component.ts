import { Component, ElementRef, HostListener, Input, signal } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";

/**
 * Row overflow menu ("⋯"). Project <button class="fx-menu-item"> / <a> items.
 * Closes on outside click, Escape, an item click, or any scroll/resize.
 *
 * The dropdown is rendered `position: fixed` and positioned by hand against
 * the trigger — so it is never clipped by an ancestor's `overflow` (every
 * table sits inside `.fx-table-scroll`, which scrolls on both axes).
 */
@Component({
  selector: "app-action-menu",
  standalone: true,
  imports: [TranslateModule],
  template: `
    <div class="fx-action-menu">
      <button
        #trigger
        type="button"
        class="fx-action-trigger"
        [class.is-open]="open()"
        [attr.aria-label]="'common.actions' | translate"
        [attr.aria-expanded]="open()"
        (click)="toggle($event)"
      >
        <i class="bi bi-three-dots"></i>
      </button>
      @if (open()) {
        <div #menu class="fx-menu fx-menu--fixed" role="menu" (click)="onMenuClick()">
          <ng-content></ng-content>
        </div>
      }
    </div>
  `,
})
export class ActionMenuComponent {
  @Input() align: "start" | "end" = "end";
  readonly open = signal(false);

  constructor(private readonly host: ElementRef<HTMLElement>) {}

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    const next = !this.open();
    this.open.set(next);
    if (next) setTimeout(() => this.position());
  }

  onMenuClick(): void {
    this.open.set(false);
  }

  private position(): void {
    const root = this.host.nativeElement;
    const trigger = root.querySelector<HTMLElement>(".fx-action-trigger");
    const menu = root.querySelector<HTMLElement>(".fx-menu");
    if (!trigger || !menu) return;

    const t = trigger.getBoundingClientRect();
    const m = menu.getBoundingClientRect();
    const gap = 4;
    const margin = 8;

    // Flip above the trigger when there isn't room below.
    const below = window.innerHeight - t.bottom;
    const top = below < m.height + margin && t.top > m.height + margin ? t.top - m.height - gap : t.bottom + gap;

    // Right-align to the trigger (or left-align when align="start"), clamped to the viewport.
    let left = this.align === "start" ? t.left : t.right - m.width;
    left = Math.max(margin, Math.min(left, window.innerWidth - m.width - margin));

    menu.style.top = `${Math.round(top)}px`;
    menu.style.left = `${Math.round(left)}px`;
  }

  @HostListener("document:click", ["$event"])
  onDocClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  @HostListener("document:keydown.escape")
  onEsc(): void {
    this.open.set(false);
  }

  @HostListener("window:scroll")
  @HostListener("window:resize")
  onViewportChange(): void {
    if (this.open()) this.open.set(false);
  }
}
