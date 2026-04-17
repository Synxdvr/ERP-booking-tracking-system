import { Booking, ConflictResult, Room, TimeSlot } from "@/types";

/**
 * Conflict check — room capacity only.
 *
 * Staff double-booking is intentionally allowed: therapists at S'thetic
 * can attend multiple clients simultaneously (e.g. monitoring a facial
 * while treating another client). The physical constraint is the room.
 *
 * Room conflict fires only when bookings in that room >= room capacity.
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

  // Room capacity check
  const room = rooms.find((r) => r.id === params.room_id);
  const capacity = room?.capacity ?? 1;
  const roomBookings = candidates.filter((b) => b.room_id === params.room_id);

  if (roomBookings.length >= capacity) {
    const unit = capacity >= 5 ? "chairs" : capacity === 1 ? "bed" : "beds";
    return {
      hasConflict: true,
      conflictType: "room",
      conflictDetail: `${room?.name ?? "Room"} is fully booked at this time (${capacity} of ${capacity} ${unit} taken).`,
    };
  }

  return { hasConflict: false };
}
