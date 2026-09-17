import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { AuthService } from "../../core/auth/auth.service";
import { NavGroup, NavLeaf } from "../../core/configuration/navigation.service";
import { SidebarComponent } from "./sidebar.component";

@Component({ standalone: true, template: "" })
class BlankComponent {}

describe("SidebarComponent", () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let component: SidebarComponent;
  let authStub: { currentUser: jasmine.Spy; logout: jasmine.Spy };

  const dashboardItem: NavLeaf = { path: "/owner/dashboard", icon: "bi-house", labelKey: "nav.dashboard" };
  const groups: NavGroup[] = [
    {
      id: "management",
      labelKey: "nav.management",
      icon: "bi-people",
      items: [
        { path: "/owner/clients", icon: "bi-people", labelKey: "nav.clients" },
        { path: "/owner/contracts", icon: "bi-file-earmark-text", labelKey: "nav.contracts", comingSoon: true },
      ],
    },
  ];
  const secondaryItems: NavLeaf[] = [{ path: "/owner/settings", icon: "bi-gear", labelKey: "nav.settings" }];

  beforeEach(async () => {
    authStub = {
      currentUser: jasmine.createSpy().and.returnValue({ full_name: "Amine Test", email: "amine@fitora.test" }),
      logout: jasmine.createSpy(),
    };

    await TestBed.configureTestingModule({
      imports: [SidebarComponent, TranslateModule.forRoot()],
      providers: [provideRouter([{ path: "**", component: BlankComponent }]), { provide: AuthService, useValue: authStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    component.dashboardItem = dashboardItem;
    component.groups = groups;
    component.secondaryItems = secondaryItems;
    fixture.detectChanges();
  });

  it("renders the dashboard item, group labels and their items", () => {
    const html = fixture.nativeElement as HTMLElement;
    expect(html.textContent).toContain("nav.dashboard");
    expect(html.textContent).toContain("nav.management");
    expect(html.textContent).toContain("nav.clients");
    expect(html.textContent).toContain("nav.contracts");
    expect(html.textContent).toContain("nav.settings");
  });

  it("flags a coming-soon item", () => {
    const html = fixture.nativeElement as HTMLElement;
    expect(html.textContent).toContain("nav.coming_soon");
  });

  it("shows the signed-in user's name and email", () => {
    const html = fixture.nativeElement as HTMLElement;
    expect(html.textContent).toContain("Amine Test");
    expect(html.textContent).toContain("amine@fitora.test");
  });

  it("logs out when the footer button is clicked", () => {
    component.logout();
    expect(authStub.logout).toHaveBeenCalled();
  });

  it("falls back to the lightning-bolt mark when there is no custom logo", () => {
    const html = fixture.nativeElement as HTMLElement;
    expect(html.querySelector(".app-sidebar-mark i.bi-lightning-charge-fill")).not.toBeNull();
  });

  it("renders the logo image when brandLogoUrl is set", () => {
    component.brandLogoUrl = "https://example.com/logo.png";
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector(".app-sidebar-mark img") as HTMLImageElement;
    expect(img.src).toContain("logo.png");
  });
});
