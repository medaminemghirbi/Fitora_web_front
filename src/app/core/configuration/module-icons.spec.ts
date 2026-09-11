import { moduleIcon, MODULE_ICONS } from "./module-icons";

describe("moduleIcon", () => {
  it("returns the mapped icon for a known feature key", () => {
    expect(moduleIcon("clients")).toBe("bi-people");
    expect(moduleIcon("billing")).toBe("bi-credit-card");
  });

  it("falls back to a generic grid icon for an unknown key", () => {
    expect(moduleIcon("nonexistent")).toBe("bi-grid");
  });

  it("has an icon for every catalogued key", () => {
    Object.keys(MODULE_ICONS).forEach((key) => {
      expect(moduleIcon(key)).toBe(MODULE_ICONS[key]);
    });
  });
});
