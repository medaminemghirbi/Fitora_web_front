import { Component, Input, computed, signal } from "@angular/core";

@Component({
  selector: "app-avatar",
  standalone: true,
  template: `<span class="app-avatar" [style.width.px]="size" [style.height.px]="size" [style.fontSize.px]="size * 0.4">{{ initials() }}</span>`,
  styles: [`
    .app-avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: var(--color-primary-soft);
      color: var(--color-primary);
      font-weight: 600;
      flex-shrink: 0;
    }
  `],
})
export class AvatarComponent {
  private readonly nameSignal = signal("");

  @Input() set name(value: string) {
    this.nameSignal.set(value ?? "");
  }
  @Input() size = 36;

  readonly initials = computed(() => {
    const parts = this.nameSignal().trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    return parts
      .slice(0, 2)
      .map((p) => p[0]!.toUpperCase())
      .join("");
  });
}
