import { Session } from "../models/session.model";
import { isSameCalendarDay, isoWeekKey, spotsLeft } from "./member.util";

describe("member.util", () => {
  describe("spotsLeft", () => {
    it("returns capacity minus confirmed_count", () => {
      const session = { capacity: 10, confirmed_count: 3 } as Session;
      expect(spotsLeft(session)).toBe(7);
    });

    it("never goes negative", () => {
      const session = { capacity: 5, confirmed_count: 7 } as Session;
      expect(spotsLeft(session)).toBe(0);
    });
  });

  describe("isSameCalendarDay", () => {
    it("is true for the same day, different time", () => {
      const reference = new Date(2026, 8, 15, 9, 0);
      expect(isSameCalendarDay("2026-09-15T18:30:00", reference)).toBe(true);
    });

    it("is false for a different day", () => {
      const reference = new Date(2026, 8, 15, 9, 0);
      expect(isSameCalendarDay("2026-09-16T09:00:00", reference)).toBe(false);
    });
  });

  describe("isoWeekKey", () => {
    it("groups two dates in the same Mon-Sun week together", () => {
      // Monday 2026-09-14 and Sunday 2026-09-20 are the same ISO week.
      expect(isoWeekKey("2026-09-14T08:00:00")).toBe(isoWeekKey("2026-09-20T22:00:00"));
    });

    it("puts consecutive weeks in different buckets", () => {
      expect(isoWeekKey("2026-09-14T08:00:00")).not.toBe(isoWeekKey("2026-09-21T08:00:00"));
    });

    it("handles the year boundary correctly", () => {
      // 2025-12-29 (Mon) through 2026-01-04 (Sun) is ISO week 2026-W01.
      expect(isoWeekKey("2025-12-30T08:00:00")).toBe(isoWeekKey("2026-01-02T08:00:00"));
    });
  });
});
