import {
  TIMEZONE_GROUPS,
  browserTimezone,
  countryForTimezone,
  ensureTimezone,
  guessLocation,
  timezoneForCountry,
} from "./timezones";

describe("timezones", () => {
  it("TIMEZONE_GROUPS is non-empty and every zone has a label", () => {
    expect(TIMEZONE_GROUPS.length).toBeGreaterThan(0);
    for (const g of TIMEZONE_GROUPS) {
      for (const z of g.zones) expect(z.label).toBeTruthy();
    }
  });

  it("browserTimezone returns a non-empty IANA zone", () => {
    expect(browserTimezone()).toBeTruthy();
  });

  it("browserTimezone falls back to Africa/Tunis when the resolved zone is blank", () => {
    spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").and.returnValue({ timeZone: "" } as Intl.ResolvedDateTimeFormatOptions);
    expect(browserTimezone()).toBe("Africa/Tunis");
  });

  describe("countryForTimezone", () => {
    it("resolves a known zone to its country", () => {
      expect(countryForTimezone("Africa/Tunis")).toBe("TN");
    });

    it("resolves an 'extra' zone not in the curated groups", () => {
      expect(countryForTimezone("Europe/Prague")).toBe("CZ");
    });

    it("returns '' for an unknown zone or blank input", () => {
      expect(countryForTimezone("Not/AZone")).toBe("");
      expect(countryForTimezone(null)).toBe("");
      expect(countryForTimezone(undefined)).toBe("");
    });
  });

  describe("timezoneForCountry", () => {
    it("resolves a known country code, case-insensitively", () => {
      expect(timezoneForCountry("tn")).toBe("Africa/Tunis");
      expect(timezoneForCountry("TN")).toBe("Africa/Tunis");
    });

    it("returns '' for an unknown or blank code", () => {
      expect(timezoneForCountry("ZZ")).toBe("");
      expect(timezoneForCountry(null)).toBe("");
      expect(timezoneForCountry(undefined)).toBe("");
    });
  });

  it("guessLocation returns the browser timezone and its country, defaulting to TN", () => {
    const result = guessLocation();
    expect(result.timezone).toBeTruthy();
    expect(result.country).toBeTruthy();
  });

  it("guessLocation defaults the country to TN when the browser zone maps to none", () => {
    spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").and.returnValue({ timeZone: "Not/AZone" } as Intl.ResolvedDateTimeFormatOptions);
    expect(guessLocation()).toEqual({ timezone: "Not/AZone", country: "TN" });
  });

  describe("ensureTimezone", () => {
    it("returns the groups unchanged when the zone is already listed", () => {
      expect(ensureTimezone("Africa/Tunis")).toBe(TIMEZONE_GROUPS);
    });

    it("returns the groups unchanged for a blank zone", () => {
      expect(ensureTimezone("")).toBe(TIMEZONE_GROUPS);
    });

    it("prepends a '—' group for an off-list zone", () => {
      const result = ensureTimezone("Pacific/Fiji");
      expect(result[0].region).toBe("—");
      expect(result[0].zones[0].value).toBe("Pacific/Fiji");
      expect(result.length).toBe(TIMEZONE_GROUPS.length + 1);
    });

    it("labels the off-list zone by city name alone when its GMT offset can't be computed", () => {
      const result = ensureTimezone("Not/AZone");
      expect(result[0].zones[0].label).toBe("AZone");
    });
  });
});
