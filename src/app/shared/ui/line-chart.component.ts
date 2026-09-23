import { Component, Input, computed, signal } from "@angular/core";

export interface ChartPoint {
  label: string;
  value: number;
}

interface Plotted extends ChartPoint {
  x: number;
  y: number;
}

// The drawing box. Fixed, and scaled to the container by the viewBox, so the
// geometry below is plain arithmetic rather than layout.
const W = 760;
const H = 252;
const LEFT = 48;
const RIGHT = 744;
const TOP = 12;
const BOTTOM = 212;
const BASELINE = 236;

/**
 * One line over time, with its area filled.
 *
 * Presentational: it is handed points and a preformatted value for the
 * marker, and knows nothing about money, months or the gym. The caller
 * formats, because only the caller knows the currency.
 *
 * Deliberately not a charting library. This draws one shape; pulling in a
 * library to do it would cost more than it saves and is the kind of thing
 * the brief's "do not overengineer" is about.
 */
@Component({
  selector: "app-line-chart",
  standalone: true,
  template: `
    <svg [attr.viewBox]="viewBox" width="100%" [attr.height]="height" role="img" [attr.aria-label]="ariaLabel">
      @for (line of gridLines(); track line.y) {
        <line [attr.x1]="left" [attr.y1]="line.y" [attr.x2]="right" [attr.y2]="line.y"
              [attr.stroke]="line.strong ? 'var(--color-border)' : 'var(--color-surface-sunken)'" stroke-width="1"></line>
        <text [attr.x]="left - 10" [attr.y]="line.y + 4" text-anchor="end" font-size="10.5"
              fill="var(--color-text-secondary)">{{ line.label }}</text>
      }

      @if (plotted().length > 1) {
        <path [attr.d]="areaPath()" fill="var(--color-primary-soft)"></path>
        <path [attr.d]="linePath()" fill="none" stroke="var(--color-primary)" stroke-width="2.4"
              stroke-linecap="round" stroke-linejoin="round"></path>
      }

      @if (last(); as point) {
        <line [attr.x1]="point.x" [attr.y1]="point.y" [attr.x2]="point.x" [attr.y2]="bottom"
              stroke="var(--color-border-strong)" stroke-width="1" stroke-dasharray="3 3"></line>
        <circle [attr.cx]="point.x" [attr.cy]="point.y" r="5.5" fill="var(--color-surface)"
                stroke="var(--color-primary)" stroke-width="2.6"></circle>

        @if (marker) {
          <g [attr.transform]="'translate(' + markerX() + ', ' + markerY() + ')'">
            <rect width="118" height="42" rx="9" fill="var(--color-text)"></rect>
            <text x="14" y="19" font-size="13" font-weight="700" fill="var(--color-surface)">{{ marker }}</text>
            <text x="14" y="34" font-size="11" fill="var(--color-muted)">{{ point.label }}</text>
          </g>
        }
      }

      @for (point of plotted(); track point.label; let i = $index) {
        <text [attr.x]="point.x" [attr.y]="baseline" text-anchor="middle" font-size="11"
              [attr.font-weight]="isEnd(i) ? 700 : 400"
              [attr.fill]="isEnd(i) ? 'var(--color-text)' : 'var(--color-text-secondary)'">{{ point.label }}</text>
      }
    </svg>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class LineChartComponent {
  @Input({ required: true }) set points(value: ChartPoint[]) {
    this.source.set(value ?? []);
  }
  /** Preformatted value for the marker on the last point. Empty hides it. */
  @Input() marker = "";
  /**
   * Formats a gridline's value — the caller owns units.
   *
   * Signal-backed like `points`: gridLines() is a computed, and a plain
   * field would be read once and cached, so a formatter bound after the
   * first evaluation would never be used.
   */
  @Input() set tickLabel(value: (n: number) => string) {
    this.formatter.set({ format: value });
  }
  @Input() ariaLabel = "";

  private readonly source = signal<ChartPoint[]>([]);
  private readonly formatter = signal<{ format: (n: number) => string }>({ format: (n) => String(n) });

  readonly viewBox = `0 0 ${W} ${H}`;
  readonly height = H;
  readonly left = LEFT;
  readonly right = RIGHT;
  readonly bottom = BOTTOM;
  readonly baseline = BASELINE;

  /**
   * The top of the scale, rounded up to something a person would pick.
   * A ceiling equal to the tallest point would put that point on the top
   * gridline, where it reads as clipped.
   */
  private readonly ceiling = computed(() => {
    const max = Math.max(0, ...this.source().map((p) => p.value));
    if (max <= 0) return 4;

    const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
    return Math.ceil(max / magnitude * 1.05) * magnitude;
  });

  readonly plotted = computed<Plotted[]>(() => {
    const points = this.source();
    if (points.length === 0) return [];

    const ceiling = this.ceiling();
    const step = points.length > 1 ? (RIGHT - LEFT) / (points.length - 1) : 0;

    return points.map((point, i) => ({
      ...point,
      x: LEFT + step * i,
      y: BOTTOM - (Math.max(0, point.value) / ceiling) * (BOTTOM - TOP),
    }));
  });

  readonly last = computed<Plotted | null>(() => this.plotted().at(-1) ?? null);

  readonly gridLines = computed(() => {
    const ceiling = this.ceiling();
    return [0, 1, 2, 3].map((i) => ({
      y: BOTTOM - ((BOTTOM - TOP) / 3) * i,
      label: this.formatter().format((ceiling / 3) * i),
      strong: i === 0,
    }));
  });

  readonly linePath = computed(() => `M ${this.plotted().map((p) => `${p.x} ${p.y}`).join(" L ")}`);
  readonly areaPath = computed(() => {
    const points = this.plotted();
    if (points.length === 0) return "";
    return `${this.linePath()} L ${RIGHT} ${BOTTOM} L ${LEFT} ${BOTTOM} Z`;
  });

  /** The marker sits left of the last point so it cannot run off the edge. */
  readonly markerX = computed(() => Math.min((this.last()?.x ?? 0) - 118, RIGHT - 118));
  readonly markerY = computed(() => Math.max(TOP - 6, (this.last()?.y ?? 0) - 52));

  isEnd(index: number): boolean {
    return index === 0 || index === this.plotted().length - 1;
  }
}
