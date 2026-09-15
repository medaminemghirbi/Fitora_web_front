import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { Component } from "@angular/core";
import { ComponentFixture, TestBed, fakeAsync, tick } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { of, throwError } from "rxjs";
import { AuthService } from "../../core/auth/auth.service";
import { NavGroup, NavLeaf } from "../../core/configuration/navigation.service";
import { CompanyService } from "../../core/services/company.service";
import { NavbarComponent } from "./navbar.component";

@Component({ standalone: true, template: "" })
class BlankComponent {}

describe("NavbarComponent", () => {
  let fixture: ComponentFixture<NavbarComponent>;
  let component: NavbarComponent;
  let authStub: { currentUser: jasmine.Spy; logout: jasmine.Spy };
  let companyServiceStub: { switchTo: jasmine.Spy };

  const dashboardItem: NavLeaf = { path: "/owner/dashboard", icon: "bi-house", labelKey: "nav.dashboard" };
  const groups: NavGroup[] = [
    {
      id: "sales",
      labelKey: "nav.sales",
      items: [
        { path: "/owner/clients", icon: "bi-people", labelKey: "nav.clients" },
        { path: "/owner/payments", icon: "bi-cash", labelKey: "nav.payments" },
      ],
    },
  ];

  beforeEach(async () => {
    authStub = { currentUser: jasmine.createSpy().and.returnValue({ role: "owner" }), logout: jasmine.createSpy() };
    companyServiceStub = { switchTo: jasmine.createSpy().and.returnValue(of({ company: {} })) };

    await TestBed.configureTestingModule({
      imports: [NavbarComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([{ path: "**", component: BlankComponent }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authStub },
        { provide: CompanyService, useValue: companyServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    component.dashboardItem = dashboardItem;
    component.groups = groups;
    fixture.detectChanges();
  });

  it("toggleGroup opens a group and closes the user menu", () => {
    component.userMenuOpen.set(true);
    component.toggleGroup("sales");
    expect(component.openGroup()).toBe("sales");
    expect(component.userMenuOpen()).toBe(false);
  });

  it("toggleGroup on an already-open group closes it", () => {
    component.toggleGroup("sales");
    component.toggleGroup("sales");
    expect(component.openGroup()).toBeNull();
  });

  it("logout delegates to AuthService", () => {
    component.logout();
    expect(authStub.logout).toHaveBeenCalled();
  });

  it("onDocClick closes menus when the click lands outside the nav menu", () => {
    component.toggleGroup("sales");
    component.onDocClick({ target: document.body } as unknown as MouseEvent);
    expect(component.openGroup()).toBeNull();
  });

  it("onDocClick leaves menus open when the click lands inside the nav menu", () => {
    const menuEl = document.createElement("div");
    menuEl.className = "app-navbar-menu";
    document.body.appendChild(menuEl);
    component.toggleGroup("sales");

    component.onDocClick({ target: menuEl } as unknown as MouseEvent);

    expect(component.openGroup()).toBe("sales");
    menuEl.remove();
  });

  it("Escape closes every menu, including the mobile menu", () => {
    component.toggleGroup("sales");
    component.userMenuOpen.set(true);
    component.mobileOpen.set(true);

    component.onEsc();

    expect(component.openGroup()).toBeNull();
    expect(component.userMenuOpen()).toBe(false);
    expect(component.mobileOpen()).toBe(false);
  });

  it("activeGroupId reflects the group owning the current route", () => {
    (component as unknown as { activeUrl: { set: (v: string) => void } })["activeUrl"].set("/owner/payments");
    expect(component.activeGroupId()).toBe("sales");
  });

  it("activePageLabel works with no dashboardItem set", () => {
    const fresh = TestBed.createComponent(NavbarComponent);
    fresh.componentInstance.groups = groups;
    fresh.detectChanges();
    (fresh.componentInstance as unknown as { activeUrl: { set: (v: string) => void } })["activeUrl"].set("/owner/payments");
    expect(fresh.componentInstance.activePageLabel()).toBe("nav.payments");
  });

  it("activePageLabel finds the longest matching path across every nav source", () => {
    component.flatItems = [{ path: "/owner", icon: "bi-house", labelKey: "nav.root" }];
    (component as unknown as { activeUrl: { set: (v: string) => void } })["activeUrl"].set("/owner/payments");
    expect(component.activePageLabel()).toBe("nav.payments");
  });

  it("activePageLabel is null when nothing matches the current route", () => {
    (component as unknown as { activeUrl: { set: (v: string) => void } })["activeUrl"].set("/somewhere/else");
    expect(component.activePageLabel()).toBeNull();
  });

  it("activePageLabel picks the longest of several matching paths", () => {
    // allLeaves() reads plain @Input properties (not signals) — it's only
    // ever (re)computed the first time something reads it, so every input
    // must be set before the very first detectChanges()/computed read.
    const fresh = TestBed.createComponent(NavbarComponent);
    fresh.componentInstance.dashboardItem = dashboardItem;
    fresh.componentInstance.groups = groups;
    fresh.componentInstance.flatItems = [
      { path: "/owner", icon: "bi-house", labelKey: "nav.root" },
      { path: "/owner/clients/4", icon: "bi-people", labelKey: "nav.clients_section" },
    ];
    fresh.detectChanges();

    (fresh.componentInstance as unknown as { activeUrl: { set: (v: string) => void } })["activeUrl"].set("/owner/clients/42");
    expect(fresh.componentInstance.activePageLabel()).toBe("nav.clients_section");
  });

  it("a real NavigationEnd event updates the active URL and closes every menu", fakeAsync(() => {
    const router = TestBed.inject(Router);
    component.toggleGroup("sales");
    component.mobileOpen.set(true);

    router.navigateByUrl("/owner/payments");
    tick();
    fixture.detectChanges();

    expect(component.activeGroupId()).toBe("sales");
    expect(component.openGroup()).toBeNull();
    expect(component.mobileOpen()).toBe(false);
  }));

  describe("company switcher", () => {
    const companies = [
      { id: "co-1", name: "Gym One", logo_url: null, currency: "TND", active: true },
      { id: "co-2", name: "Gym Two", logo_url: null, currency: "TND", active: false },
    ];

    // switchableCompanies/activeCompany are computed() signals — they only
    // re-run when a tracked Signal dependency changes. authStub.currentUser
    // is a plain jasmine spy, not a real Signal, so changing its return
    // value on the shared component (already read once in the outer
    // beforeEach) wouldn't be picked up. A fresh component per test, with
    // the stub set before its first read, sidesteps that entirely.
    function freshWith(user: Record<string, unknown>): NavbarComponent {
      authStub.currentUser.and.returnValue(user);
      const fresh = TestBed.createComponent(NavbarComponent);
      fresh.componentInstance.groups = groups;
      fresh.detectChanges();
      return fresh.componentInstance;
    }

    it("switchableCompanies is null for an owner with just one company", () => {
      expect(freshWith({ role: "owner", companies: [companies[0]] }).switchableCompanies()).toBeNull();
    });

    it("switchableCompanies is null when there's no companies field at all (staff/admin)", () => {
      expect(freshWith({ role: "staff" }).switchableCompanies()).toBeNull();
    });

    it("switchableCompanies lists every company once there's more than one, and activeCompany picks the flagged one", () => {
      const withCompanies = freshWith({ role: "owner", companies });
      expect(withCompanies.switchableCompanies()).toEqual(companies);
      expect(withCompanies.activeCompany()?.id).toBe("co-1");
    });

    it("toggleCompanySwitcher opens it and closes the group/user menus", () => {
      component.openGroup.set("sales");
      component.userMenuOpen.set(true);

      component.toggleCompanySwitcher();

      expect(component.companySwitcherOpen()).toBe(true);
      expect(component.openGroup()).toBeNull();
      expect(component.userMenuOpen()).toBe(false);
    });

    it("toggleCompanySwitcher twice closes it again", () => {
      component.toggleCompanySwitcher();
      component.toggleCompanySwitcher();
      expect(component.companySwitcherOpen()).toBe(false);
    });

    it("switchCompany does nothing but close the menu when picking the already-active company", () => {
      const owner = freshWith({ role: "owner", companies });
      owner.companySwitcherOpen.set(true);

      owner.switchCompany("co-1");

      expect(companyServiceStub.switchTo).not.toHaveBeenCalled();
      expect(owner.companySwitcherOpen()).toBe(false);
    });

    it("switchCompany calls the service and reloads to the dashboard on success", () => {
      const owner = freshWith({ role: "owner", companies });
      const reload = spyOn(owner as unknown as { reloadToDashboard(): void }, "reloadToDashboard");

      owner.switchCompany("co-2");

      expect(companyServiceStub.switchTo).toHaveBeenCalledWith("co-2");
      expect(reload).toHaveBeenCalled();
    });

    it("switchCompany resets state and stops spinning on failure", () => {
      const owner = freshWith({ role: "owner", companies });
      companyServiceStub.switchTo.and.returnValue(throwError(() => new Error("nope")));
      owner.companySwitcherOpen.set(true);

      owner.switchCompany("co-2");

      expect(owner.switching()).toBe(false);
      expect(owner.companySwitcherOpen()).toBe(false);
    });

    it("switchCompany ignores a second click while already switching", () => {
      const owner = freshWith({ role: "owner", companies });
      owner.switching.set(true);

      owner.switchCompany("co-2");

      expect(companyServiceStub.switchTo).not.toHaveBeenCalled();
    });
  });
});
