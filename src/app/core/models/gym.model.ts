/** A gym as the public directory shows it — nothing about its members. */
export interface Gym {
  id: string;
  slug: string | null;
  name: string;
  city: string | null;
  country: string | null;
  description: string | null;
  logo_url: string | null;
  primary_color: string | null;
  currency: string;
  activity_names: string[];
  /** Kilometres from the visitor — only when the directory was asked for the
   *  nearest gyms, and only for a gym that published its coordinates. */
  distance_km: number | null;
}

/** A session as a gym's public page shows it: no price, no names. */
export interface PublicSession {
  id: string;
  activity_name: string;
  activity_emoji: string | null;
  coach_name: string | null;
  starts_at: string;
  ends_at: string;
  capacity: number;
  spots_left: number;
  full: boolean;
}

export interface GymDetail extends Gym {
  address: string | null;
  phone: string | null;
  email: string | null;
  latitude: string | null;
  longitude: string | null;
  timezone: string;
  working_days: number[];
  activities: { id: string; name: string; emoji: string | null; session_format: string }[];
  sessions: PublicSession[];
}

/** One of my gyms: the public profile plus my own link to it. */
export interface MyGym extends Gym {
  joined_at: string;
  active: boolean;
  current_contract: { id: string; status: string; expires_at: string | null; plan: { name: string } } | null;
}
