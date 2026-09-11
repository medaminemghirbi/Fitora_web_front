import { Injectable, signal } from "@angular/core";

/** Owns the ⌘K command palette open state; the overlay component reacts to it. */
@Injectable({ providedIn: "root" })
export class CommandPaletteService {
  readonly isOpen = signal(false);

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  toggle(): void {
    this.isOpen.update((v) => !v);
  }
}
