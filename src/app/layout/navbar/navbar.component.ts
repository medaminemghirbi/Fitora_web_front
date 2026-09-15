import { Component, HostListener, Input, computed, inject, signal } from "@angular/core";
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from "@angular/router";
import { filter } from "rxjs";
import { TranslateModule } from "@ngx-translate/core";
import { AuthService } from "../../core/auth/auth.service";
import { NavGroup, NavLeaf } from "../../core/configuration/navigation.service";
import { CommandPaletteService } from "../../core/services/command-palette.service";
import { CompanyService } from "../../core/services/company.service";
import { ThemeService } from "../../core/services/theme.service";
import { AvatarComponent } from "../../shared/components/avatar.component";
import { NotificationBellComponent } from "../notifications/notification-bell.component";

/**
 * Top navigation bar — replaces the dark sidebar for every shell.
 * Owner: grouped dropdown menus (from NavigationService). Coach / admin:
 * a flat list of links via [flatItems].
 */
@Component({
  selector: "app-navbar",
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslateModule, AvatarComponent, NotificationBellComponent],
  templateUrl: "./navbar.component.html",
  styleUrl: "./navbar.component.scss",
})
export class NavbarComponent {
  @Input() dashboardItem: NavLeaf | null = null;
  @Input() groups: NavGroup[] = [];
  @Input() flatItems: NavLeaf[] = [];
  @Input() secondaryItems: NavLeaf[] = [];
  @Input() brandName = "Fitora";
  @Input() brandLogoUrl: string | null = null;
  @Input() brandHome = "/owner/dashboard";
  @Input() brandSuffix: string | null = null;
  @Input() showActions = true;
  @Input() showNotifications = false;
  // Set to false when a sidebar (see SidebarComponent) already renders the
  // brand mark / full desktop nav — the mobile burger + panel still use
  // [dashboardItem]/[groups]/[flatItems] regardless, since the sidebar is
  // desktop-only.
  @Input() showBrand = true;
  @Input() showDesktopNav = true;
  // Owner-only shortcut to the modules marketplace — pre-order a module,
  // see the current debt, ask for help. Rendered as a visible button rather
  // than buried in the user dropdown since it's meant to be found fast.
  @Input() showSupport = false;

  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  readonly palette = inject(CommandPaletteService);
  private readonly companyService = inject(CompanyService);
  private readonly router = inject(Router);

  readonly openGroup = signal<string | null>(null);
  readonly userMenuOpen = signal(false);
  readonly mobileOpen = signal(false);
  readonly companySwitcherOpen = signal(false);
  readonly switching = signal(false);

  // Only an owner running more than one company sees this at all — a
  // single-company owner's navbar looks exactly as it always has.
  readonly switchableCompanies = computed(() => {
    const companies = this.auth.currentUser()?.companies;
    return companies && companies.length > 1 ? companies : null;
  });
  readonly activeCompany = computed(() => this.switchableCompanies()?.find((c) => c.active) ?? null);

  private readonly activeUrl = signal(this.router.url);
  private readonly allLeaves = computed<NavLeaf[]>(() => [
    ...(this.dashboardItem ? [this.dashboardItem] : []),
    ...this.groups.flatMap((g) => g.items),
    ...this.flatItems,
    ...this.secondaryItems,
  ]);
  /** Current page label — shown next to the hamburger on mobile. */
  readonly activePageLabel = computed(() => {
    const clean = this.activeUrl().split("?")[0].split("#")[0];
    const match = this.allLeaves()
      .filter((i) => clean.startsWith(i.path))
      .sort((a, b) => b.path.length - a.path.length)[0];
    return match ? match.labelKey : null;
  });
  /** Which group holds the active route — highlights the group button. */
  readonly activeGroupId = computed(() => {
    const clean = this.activeUrl().split("?")[0].split("#")[0];
    return this.groups.find((g) => g.items.some((i) => clean.startsWith(i.path)))?.id ?? null;
  });

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.activeUrl.set(e.urlAfterRedirects);
        this.closeAll();
        this.mobileOpen.set(false);
      });
  }

  toggleGroup(id: string): void {
    this.openGroup.update((v) => (v === id ? null : id));
    this.userMenuOpen.set(false);
    this.companySwitcherOpen.set(false);
  }

  toggleCompanySwitcher(): void {
    this.companySwitcherOpen.update((v) => !v);
    this.openGroup.set(null);
    this.userMenuOpen.set(false);
  }

  // A full reload rather than a router navigation: every page's already-
  // loaded data (dashboard stats, client lists, whatever) belongs to the
  // company that was active when it fetched — switching needs a clean
  // slate everywhere, not just wherever this component thinks to refetch.
  switchCompany(companyId: string): void {
    if (this.switching() || companyId === this.activeCompany()?.id) {
      this.companySwitcherOpen.set(false);
      return;
    }

    this.switching.set(true);
    this.companyService.switchTo(companyId).subscribe({
      next: () => this.reloadToDashboard(),
      error: () => {
        this.switching.set(false);
        this.companySwitcherOpen.set(false);
      },
    });
  }

  logout(): void {
    this.auth.logout();
  }

  // Its own method purely so tests have a seam to spy on — real browsers
  // (and Karma's) don't reliably allow stubbing window.location itself.
  protected reloadToDashboard(): void {
    window.location.assign("/owner/dashboard");
  }

  private closeAll(): void {
    this.openGroup.set(null);
    this.userMenuOpen.set(false);
    this.companySwitcherOpen.set(false);
  }

  @HostListener("document:click", ["$event"])
  onDocClick(event: MouseEvent): void {
    if (!(event.target as HTMLElement).closest(".app-navbar-menu")) this.closeAll();
  }

  @HostListener("document:keydown.escape")
  onEsc(): void {
    this.closeAll();
    this.mobileOpen.set(false);
  }
}
