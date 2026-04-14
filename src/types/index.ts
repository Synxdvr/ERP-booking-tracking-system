// ─── Database row types ───────────────────────────────────────────────────────

export type UserRole = "admin" | "staff";
export type BookingStatus = "tentative" | "confirmed" | "ongoing" | "done" | "cancelled";

export type TimeSlot =
  | "11AM-12NN"
  | "12NN-1PM"
  | "1PM-2PM"
  | "2PM-3PM"
  | "3PM-4PM"
  | "4PM-5PM"
  | "5PM-6PM"
  | "6PM-7PM"
  | "7PM-8PM"
  | "8PM-9PM"
  | "9PM-10PM"
  | "10PM-11PM";

export const TIME_SLOTS: TimeSlot[] = [
  "11AM-12NN","12NN-1PM","1PM-2PM","2PM-3PM","3PM-4PM",
  "4PM-5PM","5PM-6PM","6PM-7PM","7PM-8PM","8PM-9PM",
  "9PM-10PM","10PM-11PM"
];

export const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  "11AM-12NN": "11 AM",
  "12NN-1PM":  "12 NN",
  "1PM-2PM":   "1 PM",
  "2PM-3PM":   "2 PM",
  "3PM-4PM":   "3 PM",
  "4PM-5PM":   "4 PM",
  "5PM-6PM":   "5 PM",
  "6PM-7PM":   "6 PM",
  "7PM-8PM":   "7 PM",
  "8PM-9PM":   "8 PM",
  "9PM-10PM":  "9 PM",
  "10PM-11PM": "10 PM",
};

export interface Room {
  id: string;
  name: string;
  capacity: number;
  is_active: boolean;
  created_at: string;
}

export interface Staff {
  id: string;
  name: string;
  color_hex: string;
  is_active: boolean;
  created_at: string;
}

export interface BookingService {
  id: string;
  booking_id: string;
  staff_id: string;
  service_name: string;
  staff?: Staff;
}

export interface Booking {
  id: string;
  date: string;              // YYYY-MM-DD
  booked_slot: TimeSlot;
  time_started: string | null; // HH:MM
  time_finished: string | null;
  client_name: string;
  room_id: string;
  status: BookingStatus;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  updated_at: string;
  created_at: string;
  room?: Room;
  booking_services?: BookingService[];
}

// ─── API / form types ─────────────────────────────────────────────────────────

export interface CreateBookingPayload {
  date: string;
  booked_slot: TimeSlot;
  client_name: string;
  room_id: string;
  status: BookingStatus;
  notes?: string;
  services: [{ staff_id: string; service_name: string }];
}

export interface UpdateBookingPayload extends Partial<CreateBookingPayload> {
  id: string;
  time_started?: string | null;
  time_finished?: string | null;
}

export interface ConflictResult {
  hasConflict: boolean;
  conflictType?: "room" | "staff";
  conflictDetail?: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AppUser {
  id: string;
  email: string;
  role: UserRole;
  display_name: string;
}
