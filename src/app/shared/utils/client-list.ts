import { PageMeta } from "../../core/services/sessions.service";

export const DEFAULT_PAGE_SIZE = 25;

/** Idle time after the last keystroke before a list search runs. */
export const SEARCH_DEBOUNCE_MS = 1000;

/**
 * Client-side search for pages that load their whole list at once.
 * `fields` returns the searchable strings for one item.
 */
export function filterBySearch<T>(items: T[], term: string, fields: (item: T) => (string | null | undefined)[]): T[] {
  const needle = term.trim().toLowerCase();
  if (!needle) return items;
  return items.filter((item) =>
    fields(item).some((f) => (f ?? "").toLowerCase().includes(needle))
  );
}

/** Page `page` (1-based) of `items`. */
export function pageSlice<T>(items: T[], page: number, perPage = DEFAULT_PAGE_SIZE): T[] {
  const start = (Math.max(1, page) - 1) * perPage;
  return items.slice(start, start + perPage);
}

/** A PageMeta describing a client-side slice, shaped like the server's. */
export function clientPageMeta(total: number, page: number, perPage = DEFAULT_PAGE_SIZE): PageMeta {
  return {
    page: Math.max(1, page),
    per_page: perPage,
    total,
    total_pages: Math.max(1, Math.ceil(total / perPage)),
  };
}
