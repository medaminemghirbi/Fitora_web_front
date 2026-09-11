import { clientPageMeta, DEFAULT_PAGE_SIZE, filterBySearch, pageSlice } from "./client-list";

describe("client-list utils", () => {
  interface Item {
    id: number;
    name: string;
    email: string | null;
  }

  const items: Item[] = [
    { id: 1, name: "Sarah Martin", email: "sarah@x.test" },
    { id: 2, name: "Khaled Zaidi", email: null },
    { id: 3, name: "Amira Ess", email: "amira@x.test" },
  ];

  describe("filterBySearch", () => {
    it("returns everything when the term is blank", () => {
      expect(filterBySearch(items, "  ", (i) => [i.name])).toEqual(items);
    });

    it("matches case-insensitively across the given fields", () => {
      const result = filterBySearch(items, "SARAH", (i) => [i.name, i.email]);
      expect(result).toEqual([items[0]]);
    });

    it("tolerates a null/undefined field value", () => {
      const result = filterBySearch(items, "khaled", (i) => [i.name, i.email]);
      expect(result).toEqual([items[1]]);
    });

    it("returns an empty array when nothing matches", () => {
      expect(filterBySearch(items, "nobody", (i) => [i.name])).toEqual([]);
    });
  });

  describe("pageSlice", () => {
    const many = Array.from({ length: 60 }, (_, i) => i + 1);

    it("returns the first page by default page size", () => {
      expect(pageSlice(many, 1)).toEqual(many.slice(0, DEFAULT_PAGE_SIZE));
    });

    it("returns the second page", () => {
      expect(pageSlice(many, 2)).toEqual(many.slice(DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE * 2));
    });

    it("honors a custom page size", () => {
      expect(pageSlice(many, 2, 10)).toEqual(many.slice(10, 20));
    });

    it("clamps a page below 1 to the first page", () => {
      expect(pageSlice(many, 0, 10)).toEqual(many.slice(0, 10));
      expect(pageSlice(many, -3, 10)).toEqual(many.slice(0, 10));
    });
  });

  describe("clientPageMeta", () => {
    it("computes total_pages, rounding up", () => {
      expect(clientPageMeta(45, 1, 10)).toEqual({ page: 1, per_page: 10, total: 45, total_pages: 5 });
    });

    it("has at least 1 total_page even when empty", () => {
      expect(clientPageMeta(0, 1, 10)).toEqual({ page: 1, per_page: 10, total: 0, total_pages: 1 });
    });

    it("clamps the reported page to at least 1", () => {
      expect(clientPageMeta(10, 0, 10).page).toBe(1);
    });
  });
});
