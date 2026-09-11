import {
  Component,
  ElementRef,
  HostListener,
  Input,
  ViewChild,
  computed,
  forwardRef,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";

export interface SearchableOption {
  value: string;
  label: string;
  /** Optional leading glyph — e.g. a country flag emoji. */
  prefix?: string;
}

/**
 * A combobox: a text-filterable dropdown that plugs into a reactive form via
 * `formControlName`. Keyboard: type to filter, ↑/↓ to move, Enter to pick,
 * Esc to close. Used for the country + timezone pickers at company setup.
 */
@Component({
  selector: "app-searchable-select",
  standalone: true,
  imports: [FormsModule, TranslateModule],
  template: `
    <div class="ss" [class.is-open]="open()" [class.is-disabled]="disabled()">
      <button
        #trigger
        type="button"
        class="ss-trigger form-control"
        [id]="id"
        [disabled]="disabled()"
        [attr.aria-expanded]="open()"
        aria-haspopup="listbox"
        (click)="toggle()"
        (keydown)="onTriggerKey($event)"
      >
        @if (selected(); as s) {
          <span class="ss-value">@if (s.prefix) {<span class="ss-prefix">{{ s.prefix }}</span>} {{ s.label }}</span>
        } @else {
          <span class="ss-placeholder">{{ placeholder }}</span>
        }
        <i class="bi bi-chevron-down ss-chevron"></i>
      </button>

      @if (open()) {
        <div class="ss-panel" role="listbox">
          <div class="ss-search">
            <i class="bi bi-search"></i>
            <input
              #searchInput
              type="text"
              [ngModel]="query()"
              (ngModelChange)="query.set($event); highlight.set(0)"
              (keydown)="onSearchKey($event)"
              [placeholder]="'common.search' | translate"
              autocomplete="off"
            />
          </div>
          <ul #list class="ss-list">
            @for (opt of filtered(); track opt.value; let i = $index) {
              <!-- Roving-highlight listbox: keyboard nav (Arrow/Enter) lives on the search input above, not per-option. -->
              <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
              <li
                role="option"
                [attr.aria-selected]="opt.value === value()"
                [class.is-active]="i === highlight()"
                [class.is-selected]="opt.value === value()"
                (mouseenter)="highlight.set(i)"
                (click)="pick(opt)"
              >
                @if (opt.prefix) {<span class="ss-prefix">{{ opt.prefix }}</span>}
                <span>{{ opt.label }}</span>
                @if (opt.value === value()) {<i class="bi bi-check2 ss-check"></i>}
              </li>
            } @empty {
              <li class="ss-empty">{{ "common.no_results" | translate }}</li>
            }
          </ul>
        </div>
      }
    </div>
  `,
  styles: [`
    .ss { position: relative; }

    .ss-trigger {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      width: 100%;
      text-align: start;
      cursor: pointer;
      font: inherit;
    }
    .ss.is-disabled .ss-trigger { cursor: not-allowed; opacity: 0.6; }
    .ss-value { display: inline-flex; align-items: center; gap: 0.4rem; min-width: 0; }
    .ss-value, .ss-placeholder { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ss-placeholder { color: var(--color-muted); }
    .ss-chevron { color: var(--color-muted); font-size: 0.8rem; flex-shrink: 0; transition: transform var(--transition-fast); }
    .ss.is-open .ss-chevron { transform: rotate(180deg); }
    .ss-prefix { font-size: 1.05em; line-height: 1; }

    .ss-panel {
      position: absolute;
      z-index: var(--z-dropdown);
      inset-inline: 0;
      top: calc(100% + 4px);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      overflow: hidden;
    }

    .ss-search {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid var(--color-border);

      i { color: var(--color-muted); font-size: 0.85rem; }
      input {
        flex: 1;
        border: 0;
        background: none;
        color: var(--color-text);
        font: inherit;
        font-size: 0.9rem;
        outline: none;
      }
    }

    .ss-list {
      list-style: none;
      margin: 0;
      padding: 0.25rem;
      max-height: 15rem;
      overflow-y: auto;

      li {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.6rem;
        border-radius: var(--radius-sm);
        font-size: 0.9rem;
        cursor: pointer;
      }
      li.is-active { background: var(--color-surface-hover); }
      li.is-selected { color: var(--color-primary); font-weight: 600; }
      li span:not(.ss-prefix) { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    }
    .ss-check { color: var(--color-primary); font-size: 0.9rem; }
    .ss-empty { color: var(--color-muted); font-size: 0.85rem; padding: 0.6rem; cursor: default; }
  `],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SearchableSelectComponent), multi: true },
  ],
})
export class SearchableSelectComponent implements ControlValueAccessor {
  @Input() options: SearchableOption[] = [];
  @Input() placeholder = "";
  @Input() id?: string;

  @ViewChild("trigger") private trigger?: ElementRef<HTMLButtonElement>;
  @ViewChild("searchInput") private searchInput?: ElementRef<HTMLInputElement>;
  @ViewChild("list") private listEl?: ElementRef<HTMLUListElement>;

  readonly open = signal(false);
  readonly query = signal("");
  readonly highlight = signal(0);
  readonly value = signal<string>("");
  readonly disabled = signal(false);

  readonly selected = computed(() => this.options.find((o) => o.value === this.value()) ?? null);

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.options;
    return this.options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q));
  });

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private readonly host: ElementRef<HTMLElement>) {}

  writeValue(v: string): void {
    this.value.set(v ?? "");
  }
  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  toggle(): void {
    if (this.disabled()) return;
    this.open() ? this.close() : this.openPanel();
  }

  private openPanel(): void {
    this.query.set("");
    this.highlight.set(Math.max(0, this.filtered().findIndex((o) => o.value === this.value())));
    this.open.set(true);
    setTimeout(() => this.searchInput?.nativeElement.focus());
  }

  private close(focusTrigger = false): void {
    this.open.set(false);
    this.onTouched();
    if (focusTrigger) this.trigger?.nativeElement.focus();
  }

  pick(opt: SearchableOption): void {
    this.value.set(opt.value);
    this.onChange(opt.value);
    this.close(true);
  }

  onTriggerKey(e: KeyboardEvent): void {
    if (!this.open() && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      this.openPanel();
    }
  }

  onSearchKey(e: KeyboardEvent): void {
    const items = this.filtered();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      this.moveHighlight(1, items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      this.moveHighlight(-1, items.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = items[this.highlight()];
      if (opt) this.pick(opt);
    } else if (e.key === "Escape") {
      e.preventDefault();
      this.close(true);
    }
  }

  private moveHighlight(delta: number, len: number): void {
    if (len === 0) return;
    const next = (this.highlight() + delta + len) % len;
    this.highlight.set(next);
    setTimeout(() => this.listEl?.nativeElement.children[next]?.scrollIntoView({ block: "nearest" }));
  }

  @HostListener("document:click", ["$event"])
  onDocClick(e: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(e.target as Node)) this.close();
  }
}
