import { Pipe, PipeTransform, inject } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";

const ESCAPE_HTML: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ESCAPE_HTML[c]);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Wraps every case-insensitive occurrence of `term` in `text` with
 * `<mark class="fx-hl">` — used to highlight the active search term in list
 * tables. Both the source text and the term are escaped first, so the
 * returned HTML only ever contains our own `<mark>` tags.
 *
 * Usage: `<span [innerHTML]="row.name | highlight: search()"></span>`
 */
@Pipe({ name: "highlight", standalone: true })
export class HighlightPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  transform(text: string | null | undefined, term: string | null | undefined): SafeHtml {
    const source = text == null ? "" : String(text);
    const needle = (term ?? "").trim();
    if (!needle) return source;

    // Match in escaped space so a term with & < > still lines up with the text.
    const re = new RegExp(escapeRegExp(escapeHtml(needle)), "gi");
    const html = escapeHtml(source).replace(re, (match) => `<mark class="fx-hl">${match}</mark>`);
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
