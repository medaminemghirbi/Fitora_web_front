import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { AuthService } from "../../core/auth/auth.service";
import { NavGroup, NavLeaf } from "../../core/configuration/navigation.service";
import { NavbarComponent } from "./navbar.component";

describe("NavbarComponent", () => {
  let fixture: ComponentFixture<NavbarComponent>;
  let component: NavbarComponent;
  let authStub: { currentUser: jasmine.Spy; logout: jasmine.Spy };

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

    await TestBed.configureTestingModule({
      imports: [NavbarComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authStub },
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

  it("activePageLabel finds the longest matching path across every nav source", () => {
    component.flatItems = [{ path: "/owner", icon: "bi-house", labelKey: "nav.root" }];
    (component as unknown as { activeUrl: { set: (v: string) => void } })["activeUrl"].set("/owner/payments");
    expect(component.activePageLabel()).toBe("nav.payments");
  });

  it("activePageLabel is null when nothing matches the current route", () => {
    (component as unknown as { activeUrl: { set: (v: string) => void } })["activeUrl"].set("/somewhere/else");
    expect(component.activePageLabel()).toBeNull();
  });
});
