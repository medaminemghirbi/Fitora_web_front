import { isValidPhone } from "./phone";

describe("isValidPhone", () => {
  it("takes the usual ways of writing a number", () => {
    for (const phone of ["+216 22 123 456", "22123456", "(+33) 6.12.34.56.78", "06-12-34-56-78", "  22123456  "]) {
      expect(isValidPhone(phone)).withContext(phone).toBeTrue();
    }
  });

  it("refuses what is not a number, or too short or long to be one", () => {
    for (const phone of ["", null, undefined, "appelez-moi", "1234", "+216 22 abc 456", "1234567890123456"]) {
      expect(isValidPhone(phone)).withContext(String(phone)).toBeFalse();
    }
  });
});
