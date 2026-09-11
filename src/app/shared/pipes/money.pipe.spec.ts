import { MoneyPipe } from "./money.pipe";

describe("MoneyPipe", () => {
  const pipe = new MoneyPipe();

  it("formats a whole number with the currency symbol", () => {
    expect(pipe.transform(120, "TND")).toBe("120 DT");
  });

  it("keeps two decimals when the amount isn't whole", () => {
    expect(pipe.transform(39.5, "EUR")).toBe("39.50 €");
  });

  it("parses a numeric string", () => {
    expect(pipe.transform("40", "USD")).toBe("40 $");
  });

  it("falls back to the code itself for an unknown currency", () => {
    expect(pipe.transform(10, "XYZ")).toBe("10 XYZ");
  });

  it("shows an em dash for null/undefined", () => {
    expect(pipe.transform(null, "TND")).toBe("—");
    expect(pipe.transform(undefined, "TND")).toBe("—");
  });

  it("passes through a non-numeric string as-is", () => {
    expect(pipe.transform("n/a", "TND")).toBe("n/a DT");
  });
});
