"use client";
import { useDroppable } from "@dnd-kit/core";
import { Booking, Room, TimeSlot, TIME_SLOTS, TIME_SLOT_LABELS } from "@/types";
import { useScheduleStore } from "@/lib/store";
import BookingCard from "./BookingCard";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface Props { bookings: Booking[]; rooms: Room[]; isLoading: boolean; }

export default function ScheduleGrid({ bookings, rooms, isLoading }: Props) {
  const { openNewBooking } = useScheduleStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--charcoal-mid)] text-sm">
        <div className="flex gap-2 items-center animate-pulse">
          <div className="w-1.5 h-1.5 bg-[var(--gold)] rounded-full" />
          <div className="w-1.5 h-1.5 bg-[var(--gold)] rounded-full animation-delay-100" />
          <div className="w-1.5 h-1.5 bg-[var(--gold)] rounded-full animation-delay-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full">
      <table className="min-w-full border-separate border-spacing-0">
        <thead className="sticky top-0 z-10">
          <tr>
            {/* Time column header */}
            <th className="w-20 bg-[var(--charcoal)] text-[var(--gold)] text-[10px] tracking-widest uppercase font-medium px-3 py-3 text-left border-b border-charcoal-700">
              Time
            </th>
            {rooms.map((room) => (
              <th key={room.id}
                className="bg-[var(--charcoal)] text-[var(--gold)] text-[10px] tracking-widest uppercase font-medium px-3 py-3 text-left border-b border-charcoal-700 min-w-[160px]">
                {room.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TIME_SLOTS.map((slot, rowIdx) => (
            <tr key={slot} className={cn(rowIdx % 2 === 0 ? "bg-white" : "bg-[var(--cream-100)]")}>
              {/* Time label */}
              <td className="px-3 py-2 text-xs font-medium text-[var(--charcoal-mid)] border-b border-[var(--cream-3)] align-top whitespace-nowrap w-20">
                {TIME_SLOT_LABELS[slot]}
              </td>
              {rooms.map((room) => {
                const cellBookings = bookings.filter(
                  (b) => b.booked_slot === slot && b.room_id === room.id
                );
                return (
                  <SlotCell
                    key={`${slot}-${room.id}`}
                    slot={slot}
                    roomId={room.id}
                    bookings={cellBookings}
                    onAddClick={() => openNewBooking(slot, room.id)}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SlotCell({ slot, roomId, bookings, onAddClick }: {
  slot: TimeSlot; roomId: string; bookings: Booking[]; onAddClick: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `${slot}::${roomId}` });

  return (
    <td
      ref={setNodeRef}
      onClick={bookings.length === 0 ? onAddClick : undefined}
      className={cn(
        "slot-cell px-2 py-2 border-b border-[var(--cream-3)] align-top min-h-[72px]",
        "transition-colors duration-100 group relative",
        isOver && "bg-[rgba(212,175,55,0.12)] ring-1 ring-inset ring-[var(--gold)]",
        bookings.length === 0 && "cursor-pointer",
      )}
    >
      <div className="space-y-1.5 min-h-[56px]">
        {bookings.map((b) => <BookingCard key={b.id} booking={b} />)}
        {bookings.length === 0 && (
          <div className="hidden group-hover:flex items-center justify-center h-10 rounded-lg border border-dashed border-[var(--gold)] opacity-50 transition">
            <Plus size={14} className="text-[var(--gold)]" />
          </div>
        )}
      </div>
    </td>
  );
}
