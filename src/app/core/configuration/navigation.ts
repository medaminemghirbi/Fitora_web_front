// The navigation blueprint: the full set of sidebar entries the owner-area
// shell can show, before any per-login filtering. NavigationService filters
// this by permission (and owner-only). Routing details (path, icon) stay
// here on the frontend; the backend only supplies permissions.

export interface NavLeafBlueprint {
  path: string;
  icon: string;
  labelKey: string;
  subtitleKey?: string;
  // Capability required to see it. Undefined = visible to anyone in the shell.
  permission?: string;
  // Real link (points at a placeholder page) that only carries a "soon" badge.
  comingSoon?: boolean;
  // Hidden from every non-owner staff role.
  ownerOnly?: boolean;
}

export interface NavGroupBlueprint {
  id: string;
  labelKey: string;
  ownerOnly?: boolean;
  items: NavLeafBlueprint[];
}

export const DASHBOARD_NAV: NavLeafBlueprint = {
  path: "/owner/dashboard",
  icon: "bi-grid-1x2",
  labelKey: "nav.dashboard",
  permission: "reports",
};

export const NAV_BLUEPRINT: NavGroupBlueprint[] = [
  {
    id: "management",
    labelKey: "nav.management",
    items: [
      { path: "/owner/clients", icon: "bi-people", labelKey: "nav.clients", permission: "clients" },
      { path: "/owner/contracts", icon: "bi-file-earmark-text", labelKey: "nav.contracts", permission: "contracts" },
    ],
  },
  {
    id: "planning",
    labelKey: "nav.planning",
    items: [
      { path: "/owner/calendar", icon: "bi-calendar3", labelKey: "nav.calendar" },
      { path: "/owner/bookings", icon: "bi-journal-check", labelKey: "nav.bookings", permission: "bookings" },
    ],
  },
  {
    id: "finances",
    labelKey: "nav.finances",
    items: [
      { path: "/owner/payments", icon: "bi-credit-card", labelKey: "nav.payments", permission: "payments" },
    ],
  },
  {
    id: "resources",
    labelKey: "nav.directories",
    items: [
      { path: "/owner/directories/company-library", icon: "bi-folder2-open", labelKey: "nav.company_library", permission: "company_library" },
      { path: "/owner/directories/suppliers", icon: "bi-truck", labelKey: "nav.suppliers" },
    ],
  },
  {
    id: "hr",
    labelKey: "nav.hr",
    ownerOnly: true,
    items: [
      { path: "/owner/team", icon: "bi-person-vcard", labelKey: "nav.team", subtitleKey: "nav.team_subtitle", permission: "coaches" },
      { path: "/owner/hr/payroll", icon: "bi-file-earmark-ruled", labelKey: "nav.payroll_presheet", ownerOnly: true },
    ],
  },
];

export const SECONDARY_NAV: NavLeafBlueprint[] = [
  { path: "/owner/subscription", icon: "bi-stars", labelKey: "nav.fitora_subscription", ownerOnly: true },
  { path: "/owner/updates", icon: "bi-megaphone", labelKey: "nav.updates", ownerOnly: true },
  { path: "/owner/settings", icon: "bi-gear", labelKey: "nav.settings", ownerOnly: true },
];
