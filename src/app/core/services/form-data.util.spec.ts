import { toFormData } from "./form-data.util";

describe("toFormData", () => {
  it("namespaces every field under the root key", () => {
    const fd = toFormData("supplier", { name: "Alpha", city: "Sousse" });

    expect(fd.get("supplier[name]")).toBe("Alpha");
    expect(fd.get("supplier[city]")).toBe("Sousse");
  });

  it("skips undefined and null values", () => {
    const fd = toFormData("supplier", { name: "Alpha", notes: undefined, phone: null });

    expect(fd.has("supplier[notes]")).toBe(false);
    expect(fd.has("supplier[phone]")).toBe(false);
    expect(fd.has("supplier[name]")).toBe(true);
  });

  it("keeps a File value as-is instead of stringifying it", () => {
    const file = new File(["data"], "photo.png", { type: "image/png" });
    const fd = toFormData("supplier", { photo: file });

    expect(fd.get("supplier[photo]")).toBe(file);
  });

  it("stringifies non-string, non-File values", () => {
    const fd = toFormData("supplier", { active: true, capacity: 12 });

    expect(fd.get("supplier[active]")).toBe("true");
    expect(fd.get("supplier[capacity]")).toBe("12");
  });
});
