/**
 * A room: a Pilates studio, an EMS cabin, a boxing ring, a squash court.
 *
 * Only exists for a gym that turned rooms on (settings.features.spaces).
 * What a room is actually for is knowing two sessions are not in it at
 * once — enforced by a database constraint, not by this screen.
 */
export interface Space {
  id: string;
  name: string;
  /** Free text ("studio", "cabine", "ring"). Nothing branches on it. */
  kind: string | null;
  /** How many people fit in the ROOM. A session in it may seat fewer. */
  capacity: number | null;
  active: boolean;
  /** Activities restricted to this room. Empty = nothing singles it out. */
  activity_ids: string[];
  /** False once something upcoming is scheduled here. */
  deletable: boolean;
}
