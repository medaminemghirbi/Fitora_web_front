import { TestBed } from "@angular/core/testing";
import { AuthService } from "../../../core/auth/auth.service";
import { SettingsSection, SettingsSectionsService } from "./settings-sections";

describe("SettingsSectionsService", () => {
  let service: SettingsSectionsService;
  let authStub: { currentUser: jasmine.Spy; hasPermission: jasmine.Spy };

  function build(role: string): void {
    TestBed.resetTestingModule();
    authStub = {
      currentUser: jasmine.createSpy().and.returnValue({ role }),
      hasPermission: jasmine.createSpy().and.returnValue(false),
    };
    TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: authStub }] });
    service = TestBed.inject(SettingsSectionsService);
  }

  it("an owner sees every section", () => {
    build("owner");
    expect(service.sections().length).toBeGreaterThan(0);
  });

  it("a non-owner never sees an ownerOnly section", () => {
    build("staff");
    expect(service.sections().every((s) => !s.ownerOnly)).toBe(true);
  });

  it("a non-owner sees a permission-gated section only with that permission", () => {
    build("staff");
    authStub.hasPermission.and.callFake((key: string) => key === "activities");
    expect(service.sections().some((s) => s.path === "activities")).toBe(true);
    expect(service.sections().some((s) => s.path === "contract-types")).toBe(false);
  });

  it("groupedSections groups visible sections and drops empty groups", () => {
    build("owner");
    const groups = service.groupedSections();
    expect(groups.every((g) => g.sections.length > 0)).toBe(true);
  });

  it("navGroups appends the always-visible Appearance group", () => {
    build("staff");
    const groups = service.navGroups();
    expect(groups[groups.length - 1].key).toBe("appearance");
  });

  it("isVisible defaults to true for a section with neither ownerOnly nor a permission", () => {
    build("staff");
    const bare: SettingsSection = { path: "x", icon: "bi-x", labelKey: "x", descKey: "x", group: "planning" };
    const isVisible = (service as unknown as { isVisible(s: SettingsSection): boolean }).isVisible.bind(service);
    expect(isVisible(bare)).toBe(true);
  });
});
