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
  // A settings.features key. The entry exists only for a company that turned
  // that feature on — a one-room gym has no rooms menu, because it has no
  // rooms and asking it about them would be a question with one answer.
  feature?: string;
}

export interface NavGroupBlueprint {
  id: string;
  labelKey: string;
  // Shown on the top bar next to the group's label.
  icon: string;
  ownerOnly?: boolean;
  items: NavLeafBlueprint[];
}

export const DASHBOARD_NAV: NavLeafBlueprint = {
  path: "/owner/dashboard",
  icon: "bi-sun",
  labelKey: "nav.today",
  permission: "reports",
};

/**
 * Six entries, in the order a gym's day runs: who is here, what is on, what
 * they bought, what they owe, who is working.
 *
 * "Bookings" is deliberately absent — a booking is read from the session it
 * belongs to or from the member's own file, never from a global list, so the
 * page stays routable without taking a slot in the bar.
 */
export const NAV_BLUEPRINT: NavGroupBlueprint[] = [
  {
    id: "clients",
    icon: "bi-people",
    labelKey: "nav.clients",
    items: [
      { path: "/owner/clients", icon: "bi-people", labelKey: "nav.clients", permission: "clients" },
    ],
  },
  {
    id: "planning",
    icon: "bi-calendar3",
    labelKey: "nav.planning",
    items: [
      { path: "/owner/calendar", icon: "bi-calendar3", labelKey: "nav.planning" },
      { path: "/owner/spaces", icon: "bi-door-open", labelKey: "nav.spaces", permission: "spaces", feature: "spaces" },
    ],
  },
  {
    id: "subscriptions",
    icon: "bi-award",
    labelKey: "nav.subscriptions",
    items: [
      { path: "/owner/contracts", icon: "bi-file-earmark-text", labelKey: "nav.subscriptions_active", permission: "contracts" },
      { path: "/owner/catalogue", icon: "bi-award", labelKey: "nav.catalogue", permission: "contract_types" },
    ],
  },
  {
    id: "finances",
    icon: "bi-cash-coin",
    labelKey: "nav.payments",
    items: [
      { path: "/owner/payments", icon: "bi-cash-coin", labelKey: "nav.payments", permission: "payments" },
    ],
  },
  {
    id: "team",
    icon: "bi-person-vcard",
    labelKey: "nav.team",
    ownerOnly: true,
    items: [
      { path: "/owner/team", icon: "bi-person-vcard", labelKey: "nav.team", subtitleKey: "nav.team_subtitle", permission: "coaches" },
    ],
  },
];

// "Nouveautés" left the menu: an announcement is a notification, and the bell
// already carries them.
export const SECONDARY_NAV: NavLeafBlueprint[] = [
  { path: "/owner/subscription", icon: "bi-stars", labelKey: "nav.fitora_subscription", ownerOnly: true },
  { path: "/owner/settings", icon: "bi-gear", labelKey: "nav.settings", ownerOnly: true },
];
