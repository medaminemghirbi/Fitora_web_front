// Icon per feature key — used by the subscription page's "what's included"
// list. Kept 1:1 with ModuleCatalog::CATALOG on the backend.
export const MODULE_ICONS: Record<string, string> = {
  clients: "bi-people",
  classes: "bi-calendar3",
  bookings: "bi-journal-check",
  memberships: "bi-file-earmark-text",
  billing: "bi-credit-card",
  ged: "bi-folder2-open",
  hr: "bi-person-vcard",
  payroll: "bi-file-earmark-ruled",
  suppliers: "bi-truck",
};

export function moduleIcon(key: string): string {
  return MODULE_ICONS[key] ?? "bi-grid";
}
