import { Booking, ConflictResult, Room, TimeSlot } from "@/types";

/**
 * Room conflict only triggers when the number of existing bookings
 * in that room at that slot equals or exceeds the room's capacity.
 * e.g. Nails Area (capacity=5) allows up to 5 simultaneous bookings.
 * Staff conflict triggers if the same therapist is assigned elsewhere.
 */
export function checkConflict(
  params: {
    date: string;
    booked_slot: TimeSlot;
    room_id: string;
    staff_ids: string[];
    exclude_booking_id?: string;
  },
  existingBookings: Booking[],
  rooms: Room[]
): ConflictResult {
  const candidates = existingBookings.filter(
    (b) =>
      b.date === params.date &&
      b.booked_slot === params.booked_slot &&
      b.status !== "cancelled" &&
      b.id !== params.exclude_booking_id
  );

  // Room conflict — respect capacity
  const room = rooms.find((r) => r.id === params.room_id);
  const capacity = room?.capacity ?? 1;
  const roomBookings = candidates.filter((b) => b.room_id === params.room_id);

  if (roomBookings.length >= capacity) {
    return {
      hasConflict: true,
      conflictType: "room",
      conflictDetail: `${room?.name ?? "Room"} is fully booked at this time (${capacity} of ${capacity} ${capacity === 1 ? "bed" : capacity >= 5 ? "chairs" : "beds"} taken).`,
    };
  }

  // Staff conflict — same therapist can't be in two places at once
  for (const booking of candidates) {
    const existingStaffIds = (booking.booking_services ?? []).map((s) => s.staff_id);
    const overlap = params.staff_ids.find((id) => existingStaffIds.includes(id));
    if (overlap) {
      const staffName =
        booking.booking_services?.find((s) => s.staff_id === overlap)?.staff?.name ?? overlap;
      return {
        hasConflict: true,
        conflictType: "staff",
        conflictDetail: `${staffName} is already assigned to ${booking.client_name} at this time.`,
      };
    }
  }

  return { hasConflict: false };
}
