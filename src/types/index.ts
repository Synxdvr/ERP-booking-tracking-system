export type UserRole = "admin" | "staff";
export type BookingStatus = "confirmed" | "ongoing" | "done" | "cancelled";

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
  "11AM-12NN",
  "12NN-1PM",
  "1PM-2PM",
  "2PM-3PM",
  "3PM-4PM",
  "4PM-5PM",
  "5PM-6PM",
  "6PM-7PM",
  "7PM-8PM",
  "8PM-9PM",
  "9PM-10PM",
  "10PM-11PM",
];

export const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  "11AM-12NN": "11 AM",
  "12NN-1PM": "12 NN",
  "1PM-2PM": "1 PM",
  "2PM-3PM": "2 PM",
  "3PM-4PM": "3 PM",
  "4PM-5PM": "4 PM",
  "5PM-6PM": "5 PM",
  "6PM-7PM": "6 PM",
  "7PM-8PM": "7 PM",
  "8PM-9PM": "8 PM",
  "9PM-10PM": "9 PM",
  "10PM-11PM": "10 PM",
};

// Slot → clock times for cron automation + DB columns
export const SLOT_TIMES: Record<TimeSlot, { start: string; end: string }> = {
  "11AM-12NN": { start: "11:00", end: "12:00" },
  "12NN-1PM": { start: "12:00", end: "13:00" },
  "1PM-2PM": { start: "13:00", end: "14:00" },
  "2PM-3PM": { start: "14:00", end: "15:00" },
  "3PM-4PM": { start: "15:00", end: "16:00" },
  "4PM-5PM": { start: "16:00", end: "17:00" },
  "5PM-6PM": { start: "17:00", end: "18:00" },
  "6PM-7PM": { start: "18:00", end: "19:00" },
  "7PM-8PM": { start: "19:00", end: "20:00" },
  "8PM-9PM": { start: "20:00", end: "21:00" },
  "9PM-10PM": { start: "21:00", end: "22:00" },
  "10PM-11PM": { start: "22:00", end: "23:00" },
};

// ─── Status state machine ─────────────────────────────────────────────────────

export const STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  confirmed: ["ongoing", "cancelled"],
  ongoing: ["done", "cancelled"],
  done: [],
  cancelled: ["confirmed"],
};

export const STATUS_LABELS: Record<BookingStatus, string> = {
  confirmed: "Confirmed",
  ongoing: "Ongoing",
  done: "Done",
  cancelled: "Cancelled",
};

export const STATUS_BG: Record<BookingStatus, { bg: string; text: string; sub: string; dot: string; border: string }> = {
  confirmed: { bg: "bg-green-100",         text: "text-green-900",             sub: "text-green-700",             dot: "bg-green-500",      border: "border-green-200" },
  ongoing:   { bg: "bg-blue-100",          text: "text-blue-900",              sub: "text-blue-700",              dot: "bg-blue-500",       border: "border-blue-200"         },
  done:      { bg: "bg-gray-100",          text: "text-gray-900",              sub: "text-gray-700",              dot: "bg-gray-400",       border: "border-gray-200"         },
  cancelled: { bg: "bg-red-100",           text: "text-red-900",               sub: "text-red-700",               dot: "bg-red-400",        border: "border-red-200"          },
};

export const STATUS_ACTIONS: Record<
  BookingStatus,
  {
    label: string;
    next: BookingStatus;
    variant: "primary" | "danger" | "ghost";
  }[]
> = {
  confirmed: [
    { label: "Arrived", next: "ongoing", variant: "primary" },
    { label: "Cancel", next: "cancelled", variant: "danger" },
  ],
  ongoing: [
    { label: "Done", next: "done", variant: "primary" },
    { label: "Cancel", next: "cancelled", variant: "danger" },
  ],
  done: [],
  cancelled: [{ label: "Arrived", next: "confirmed", variant: "ghost" }],
};

export function isValidTransition(
  from: BookingStatus,
  to: BookingStatus,
): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

// ─── Interfaces ───────────────────────────────────────────────────────────────

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
  sort_order: number;
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
  date: string;
  booked_slot: TimeSlot;
  slot_start_time?: string | null;
  slot_end_time?: string | null;
  time_started: string | null;
  time_finished: string | null;
  client_name: string;
  room_id: string;
  status: BookingStatus;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  updated_at: string;
  created_at: string;
  rescheduled_from?: string | null;
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
  slot_start_time?: string | null;
  slot_end_time?: string | null;
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
