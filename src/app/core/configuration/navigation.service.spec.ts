import { TestBed } from "@angular/core/testing";
import { AuthService } from "../auth/auth.service";
import { NavigationService } from "./navigation.service";

describe("NavigationService", () => {
  let service: NavigationService;
  let authStub: { currentUser: jasmine.Spy; hasPermission: jasmine.Spy };

  function build(role: string, permissions: string[]): void {
    TestBed.resetTestingModule();
    authStub = {
      currentUser: jasmine.createSpy().and.returnValue({ role }),
      hasPermission: jasmine.createSpy().and.callFake((p: string) => permissions.includes(p)),
    };
    TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: authStub }] });
    service = TestBed.inject(NavigationService);
  }

  it("an owner sees the dashboard and every group, including the owner-only HR group", () => {
    build("owner", ["reports"]);
    expect(service.dashboardItem()?.path).toBe("/owner/dashboard");
    expect(service.groups().some((g) => g.id === "hr")).toBe(true);
    // calendar and suppliers carry no `permission` — visible to anyone.
    const planning = service.groups().find((g) => g.id === "planning")!;
    expect(planning.items.map((i) => i.path)).toContain("/owner/calendar");
  });

  it("hides the dashboard without the 'reports' permission", () => {
    build("staff", []);
    expect(service.dashboardItem()).toBeNull();
  });

  it("shows the dashboard for staff once they have 'reports'", () => {
    build("staff", ["reports"]);
    expect(service.dashboardItem()).not.toBeNull();
  });

  it("drops the owner-only HR group entirely for staff, even with every permission", () => {
    build("staff", ["clients", "contracts", "bookings", "payments", "company_library", "coaches"]);
    expect(service.groups().some((g) => g.id === "hr")).toBe(false);
  });

  it("drops a group with no visible items", () => {
    build("staff", []);
    // "finances" only has one item, gated on "payments" — invisible without it.
    expect(service.groups().some((g) => g.id === "finances")).toBe(false);
  });

  it("filters items within a visible group by permission", () => {
    build("staff", ["clients"]);
    const management = service.groups().find((g) => g.id === "management")!;
    expect(management.items.map((i) => i.path)).toEqual(["/owner/clients"]);
  });

  it("secondaryItems is empty for a non-owner (every entry is ownerOnly)", () => {
    build("staff", []);
    expect(service.secondaryItems()).toEqual([]);
  });

  it("secondaryItems lists everything for an owner", () => {
    build("owner", []);
    expect(service.secondaryItems().length).toBe(3);
  });

  it("homePath is the dashboard path when visible", () => {
    build("owner", ["reports"]);
    expect(service.homePath()).toBe("/owner/dashboard");
  });

  it("homePath falls back to the first visible group item when the dashboard isn't visible", () => {
    build("staff", ["clients"]);
    // "management" (clients, contracts) comes before "planning" (calendar) in
    // the blueprint, so the permitted /owner/clients wins over the
    // always-visible /owner/calendar.
    expect(service.homePath()).toBe("/owner/clients");
  });

  it("homePath falls back to the first always-visible item (no permission required) when the login has none", () => {
    build("staff", []);
    // Every current blueprint item without a `permission` is unconditionally
    // visible (only owner-only *groups* are gated by role) — so with no
    // permissions granted, "planning"/"calendar" is the first visible group.
    expect(service.homePath()).toBe("/owner/calendar");
  });
});
