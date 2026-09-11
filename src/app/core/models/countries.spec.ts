import { COUNTRIES, countryLabel, toCountryCode } from "./countries";

describe("countries", () => {
  it("COUNTRIES is a sorted, non-empty list with flags", () => {
    expect(COUNTRIES.length).toBeGreaterThan(100);
    const tn = COUNTRIES.find((c) => c.code === "TN");
    expect(tn?.flag).toBeTruthy();
    expect(tn?.name).toBeTruthy();
  });

  describe("toCountryCode", () => {
    it("returns '' for a blank value", () => {
      expect(toCountryCode(null)).toBe("");
      expect(toCountryCode(undefined)).toBe("");
      expect(toCountryCode("")).toBe("");
    });

    it("accepts an alpha-2 code, case-insensitively", () => {
      expect(toCountryCode("tn")).toBe("TN");
      expect(toCountryCode("FR")).toBe("FR");
    });

    it("accepts a French country name", () => {
      const tn = COUNTRIES.find((c) => c.code === "TN")!;
      expect(toCountryCode(tn.name)).toBe("TN");
    });

    it("accepts a legacy English name", () => {
      expect(toCountryCode("Tunisia")).toBe("TN");
    });

    it("returns '' for something that matches nothing", () => {
      expect(toCountryCode("Not a real country")).toBe("");
    });
  });

  describe("countryLabel", () => {
    it("returns '' for a blank code", () => {
      expect(countryLabel(null)).toBe("");
      expect(countryLabel("")).toBe("");
    });

    it("returns the flag + name for a known code", () => {
      expect(countryLabel("tn")).toContain("Tunisie");
    });

    it("falls back to the raw code for an unknown one", () => {
      expect(countryLabel("ZZ")).toBe("ZZ");
    });
  });
});
