import { PaymentStatus } from "./contract.model";

export type BookingStatus = "confirmed" | "cancelled" | "completed" | "no_show";

export interface Booking {
  id: string;
  status: BookingStatus;
  amount: number;
  currency: string;
  payment_status: PaymentStatus;
  created_at: string;
  covered_by: { type: "contract"; name: string } | null;
  client: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
  };
  session: {
    id: string;
    starts_at: string;
    ends_at: string;
    status: SessionStatusLike;
    activity_name: string;
    activity_emoji: string | null;
    location_name: string;
    coach_name: string | null;
  };
}

type SessionStatusLike = "scheduled" | "cancelled" | "completed";
