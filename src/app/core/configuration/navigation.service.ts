import { Injectable, computed, inject } from "@angular/core";
import { AuthService } from "../auth/auth.service";
import {
  DASHBOARD_NAV,
  NAV_BLUEPRINT,
  NavGroupBlueprint,
  NavLeafBlueprint,
  SECONDARY_NAV,
} from "./navigation";

export type NavLeaf = NavLeafBlueprint;

export interface NavGroup {
  id: string;
  labelKey: string;
  icon: string;
  items: NavLeaf[];
}

// Builds the owner-area sidebar from the shipped blueprint and the current
// login's permissions. Everything reactive — the sidebar re-renders when
// /bootstrap lands.
@Injectable({ providedIn: "root" })
export class NavigationService {
  private readonly auth = inject(AuthService);

  private readonly isOwner = computed(() => this.auth.currentUser()?.role === "owner");

  readonly dashboardItem = computed<NavLeaf | null>(() =>
    this.visible(DASHBOARD_NAV) ? DASHBOARD_NAV : null
  );

  readonly groups = computed<NavGroup[]>(() =>
    NAV_BLUEPRINT.filter((group) => this.groupVisible(group))
      .map((group) => ({
        id: group.id,
        labelKey: group.labelKey,
        icon: group.icon,
        items: group.items.filter((item) => this.visible(item)),
      }))
      .filter((group) => group.items.length > 0)
  );

  readonly secondaryItems = computed<NavLeaf[]>(() =>
    SECONDARY_NAV.filter((item) => this.visible(item))
  );

  // Where to send a login whose usual landing page isn't available for
  // their permissions.
  readonly homePath = computed<string>(() => {
    const dash = this.dashboardItem();
    if (dash) return dash.path;
    const firstGroupItem = this.groups()[0]?.items.find((i) => !i.comingSoon);
    // istanbul ignore next -- NAV_BLUEPRINT's "planning" group always has the permission-free /owner/calendar item, so groups() is never empty here
    return firstGroupItem?.path ?? "/owner/settings";
  });

  private groupVisible(group: NavGroupBlueprint): boolean {
    return !(group.ownerOnly && !this.isOwner());
  }

  private visible(item: NavLeafBlueprint): boolean {
    if (item.ownerOnly && !this.isOwner()) return false;
    if (!item.permission) return true;
    return this.auth.hasPermission(item.permission);
  }
}
