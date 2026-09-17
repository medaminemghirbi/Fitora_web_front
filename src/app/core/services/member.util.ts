import { Session } from "../models/session.model";

// Shared by the member Home/Explore/Session-detail/Progress pages — kept
// here instead of duplicated in each component.
export function spotsLeft(session: Session): number {
  return Math.max(session.capacity - session.confirmed_count, 0);
}

export function isSameCalendarDay(isoDate: string, reference: Date = new Date()): boolean {
  const d = new Date(isoDate);
  return (
    d.getFullYear() === reference.getFullYear() &&
    d.getMonth() === reference.getMonth() &&
    d.getDate() === reference.getDate()
  );
}

// Monday-start ISO week key (e.g. "2026-W38") — used to group bookings into
// weeks for the progress streak, without pulling in a date library for one
// calculation.
export function isoWeekKey(isoDate: string): string {
  const date = new Date(isoDate);
  date.setHours(0, 0, 0, 0);
  // Shift to the Thursday of this week so the ISO week number is stable
  // regardless of which day of the week `date` falls on.
  const dayNumber = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - dayNumber + 3);
  const firstThursday = new Date(date.getFullYear(), 0, 4);
  const week = 1 + Math.round(((date.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
  return `${date.getFullYear()}-W${String(week).padStart(2, "0")}`;
}
