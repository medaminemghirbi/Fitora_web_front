export type SessionFormat = "individual" | "small_group" | "collective";

/** Allowed capacity range per session format — mirrors Activity::CAPACITY_BOUNDS. */
export const CAPACITY_BOUNDS: Record<SessionFormat, { min: number; max: number | null }> = {
  individual: { min: 1, max: 1 },
  small_group: { min: 2, max: 9 },
  collective: { min: 10, max: null },
};

export interface Activity {
  id: string;
  location_id: string;
  name: string;
  emoji: string | null;
  description: string | null;
  session_format: SessionFormat;
  duration: number;
  capacity: number;
  active: boolean;
}
