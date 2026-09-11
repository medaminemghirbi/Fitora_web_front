import { BookingStatus } from "./booking.model";

export type AttendanceStatus = "present" | "absent" | "late" | "no_show";

export interface AttendanceBooking {
  booking_id: string;
  client: {
    id: string;
    full_name: string;
    phone: string | null;
  };
  booking_status: BookingStatus;
  attendance: {
    status: AttendanceStatus;
    checked_in_at: string | null;
    checked_out_at: string | null;
  } | null;
}
