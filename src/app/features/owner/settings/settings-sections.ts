import { Injectable, computed, inject } from "@angular/core";
import { AuthService } from "../../../core/auth/auth.service";

export interface SettingsSection {
  /** Child route path under /owner/settings. */
  path: string;
  /** bootstrap-icons class. */
  icon: string;
  labelKey: string;
  descKey: string;
  /** Rail group this section belongs to. */
  group: "establishment" | "planning" | "hr" | "appearance";
  ownerOnly?: boolean;
  permission?: string;
}

export interface SettingsGroup {
  key: string;
  labelKey: string;
  sections: SettingsSection[];
}

const GROUP_ORDER: { key: SettingsSection["group"]; labelKey: string }[] = [
  { key: "establishment", labelKey: "settings.group_establishment" },
  { key: "planning", labelKey: "settings.group_planning" },
  { key: "hr", labelKey: "settings.group_hr" },
];

/**
 * Single source of truth for the settings sections — consumed by the shell
 * to build the left rail. Visibility mirrors the route guards (role /
 * permission).
 */
@Injectable({ providedIn: "root" })
export class SettingsSectionsService {
  private readonly auth = inject(AuthService);

  private readonly all: SettingsSection[] = [
    { path: "company", icon: "bi-building", labelKey: "settings.nav_company", descKey: "settings.desc_company", group: "establishment", ownerOnly: true },
    { path: "branding", icon: "bi-palette", labelKey: "settings.nav_branding", descKey: "settings.desc_branding", group: "establishment", ownerOnly: true },
    { path: "mobile", icon: "bi-phone", labelKey: "settings.nav_mobile", descKey: "settings.desc_mobile", group: "establishment", ownerOnly: true },
    { path: "planning", icon: "bi-calendar3", labelKey: "settings.nav_planning", descKey: "settings.desc_planning", group: "planning", ownerOnly: true },
    { path: "activities", icon: "bi-lightning-charge", labelKey: "settings.nav_activities", descKey: "settings.desc_activities", group: "planning", permission: "activities" },
    { path: "salles", icon: "bi-door-open", labelKey: "settings.nav_salles", descKey: "settings.desc_salles", group: "planning", permission: "locations" },
    { path: "contract-types", icon: "bi-award", labelKey: "settings.nav_contract_types", descKey: "settings.desc_contract_types", group: "planning", permission: "contracts" },
    { path: "roles", icon: "bi-shield-lock", labelKey: "settings.nav_roles", descKey: "settings.desc_roles", group: "hr", ownerOnly: true },
  ];

  readonly sections = computed(() => this.all.filter((s) => this.isVisible(s)));

  readonly groupedSections = computed<SettingsGroup[]>(() => {
    const visible = this.sections();
    return GROUP_ORDER.map((g) => ({
      key: g.key,
      labelKey: g.labelKey,
      sections: visible.filter((s) => s.group === g.key),
    })).filter((g) => g.sections.length > 0);
  });

  /** Appearance (language + theme) is a pseudo-section, always visible. */
  private readonly appearanceSection: SettingsSection = {
    path: "appearance",
    icon: "bi-circle-half",
    labelKey: "settings.appearance",
    descKey: "settings.desc_appearance",
    group: "appearance",
  };

  /**
   * Full nav for the Direction A rail: the visible grouped sections plus a
   * trailing "Apparence" group. Drives both the rail and the section panel.
   */
  readonly navGroups = computed<SettingsGroup[]>(() => [
    ...this.groupedSections(),
    { key: "appearance", labelKey: "settings.group_appearance", sections: [this.appearanceSection] },
  ]);

  private isVisible(s: SettingsSection): boolean {
    if (this.auth.currentUser()?.role === "owner") return true;
    if (s.ownerOnly) return false;
    if (!s.permission) return true;
    return this.auth.hasPermission(s.permission);
  }
}
