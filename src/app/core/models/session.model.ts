export type SessionStatus = "scheduled" | "cancelled" | "completed";
export type SessionAvailability = "available" | "full" | "cancelled";

export interface Session {
  id: string;
  activity_id: string;
  activity_name: string;
  activity_emoji: string | null;
  location_id: string;
  location_name: string;
  coach_id: string | null;
  coach_name: string | null;
  starts_at: string;
  ends_at: string;
  capacity: number;
  confirmed_count: number;
  price: number;
  status: SessionStatus;
  availability: SessionAvailability;
  already_booked: boolean;
}
