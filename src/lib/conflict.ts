import { Booking, ConflictResult, TimeSlot } from "@/types";

/**
 * Checks if a new booking conflicts with existing ones.
 * Conflict = same date + same time slot + (same room OR same staff member).
 */
export function checkConflict(
  params: {
    date: string;
    booked_slot: TimeSlot;
    room_id: string;
    staff_ids: string[];
    exclude_booking_id?: string;
  },
  existingBookings: Booking[]
): ConflictResult {
  const candidates = existingBookings.filter(
    (b) =>
      b.date === params.date &&
      b.booked_slot === params.booked_slot &&
      b.status !== "cancelled" &&
      b.id !== params.exclude_booking_id
  );

  // Room conflict
  const roomConflict = candidates.find((b) => b.room_id === params.room_id);
  if (roomConflict) {
    return {
      hasConflict: true,
      conflictType: "room",
      conflictDetail: `Room already booked for ${roomConflict.client_name} at this time.`,
    };
  }

  // Staff conflict
  for (const booking of candidates) {
    const existingStaffIds = (booking.booking_services ?? []).map((s) => s.staff_id);
    const overlap = params.staff_ids.find((id) => existingStaffIds.includes(id));
    if (overlap) {
      const staffName = booking.booking_services?.find((s) => s.staff_id === overlap)?.staff?.name ?? overlap;
      return {
        hasConflict: true,
        conflictType: "staff",
        conflictDetail: `${staffName} is already assigned to ${booking.client_name} at this time.`,
      };
    }
  }

  return { hasConflict: false };
}
