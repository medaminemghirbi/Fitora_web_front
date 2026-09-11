import { currencySymbol } from "./currency";

describe("currencySymbol", () => {
  it("resolves a known currency code to its symbol", () => {
    expect(currencySymbol("TND")).toBe("DT");
    expect(currencySymbol("EUR")).toBe("€");
    expect(currencySymbol("USD")).toBe("$");
  });

  it("falls back to the raw code for an unknown currency", () => {
    expect(currencySymbol("XYZ")).toBe("XYZ");
  });

  it("returns an empty string for null/undefined/empty", () => {
    expect(currencySymbol(null)).toBe("");
    expect(currencySymbol(undefined)).toBe("");
    expect(currencySymbol("")).toBe("");
  });
});
