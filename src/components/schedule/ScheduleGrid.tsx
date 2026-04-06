"use client";
import { useDroppable } from "@dnd-kit/core";
import { Booking, Staff, TimeSlot, TIME_SLOTS, TIME_SLOT_LABELS } from "@/types";
import { useScheduleStore } from "@/lib/store";
import BookingCard from "./BookingCard";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface Props { bookings: Booking[]; staff: Staff[]; isLoading: boolean; }

export default function ScheduleGrid({ bookings, staff, isLoading }: Props) {
  const { openNewBooking } = useScheduleStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex gap-2 items-center animate-pulse">
          <div className="w-1.5 h-1.5 bg-[var(--gold)] rounded-full" />
          <div className="w-1.5 h-1.5 bg-[var(--gold)] rounded-full" />
          <div className="w-1.5 h-1.5 bg-[var(--gold)] rounded-full" />
        </div>
      </div>
    );
  }

  if (staff.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-[var(--charcoal-mid)]">
        No active staff found. Add staff under the Staff page.
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full">
      <table className="min-w-full border-separate border-spacing-0">
        <thead className="sticky top-0 z-10">
          <tr>
            {/* Time column */}
            <th className="w-20 bg-[var(--charcoal)] text-[var(--gold)] text-[10px] tracking-widest uppercase font-semibold px-3 py-3 text-left border-b border-white/10">
              Time
            </th>
            {/* One column per therapist */}
            {staff.map((member) => (
              <th key={member.id} className="bg-[var(--charcoal)] px-3 py-3 text-left border-b border-white/10 min-w-[170px]">
                <div className="flex items-center gap-2">
                  {/* Therapist color dot */}
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: member.color_hex }}
                  />
                  <span className="text-[10px] tracking-widest uppercase font-semibold text-[var(--gold)]">
                    {member.name}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TIME_SLOTS.map((slot, rowIdx) => (
            <tr key={slot} className={rowIdx % 2 === 0 ? "bg-white" : "bg-[var(--cream-2)]"}>
              {/* Time label */}
              <td className="px-3 py-2 text-xs font-semibold text-[var(--charcoal-mid)] border-b border-[var(--cream-3)] align-top whitespace-nowrap w-20">
                {TIME_SLOT_LABELS[slot]}
              </td>
              {/* One cell per therapist per slot */}
              {staff.map((member) => {
                // A booking appears in a therapist's column if that therapist is in its booking_services
                const cellBookings = bookings.filter((b) =>
                  b.booked_slot === slot &&
                  (b.booking_services ?? []).some((s) => s.staff_id === member.id)
                );
                return (
                  <SlotCell
                    key={`${slot}::${member.id}`}
                    slot={slot}
                    staffId={member.id}
                    bookings={cellBookings}
                    onAddClick={() => openNewBooking(slot, member.id)}
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

function SlotCell({ slot, staffId, bookings, onAddClick }: {
  slot: TimeSlot;
  staffId: string;
  bookings: Booking[];
  onAddClick: () => void;
}) {
  const droppableId = `${slot}::${staffId}`;
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });

  return (
    <td
      ref={setNodeRef}
      onClick={bookings.length === 0 ? onAddClick : undefined}
      className={cn(
        "slot-cell px-2 py-2 border-b border-[var(--cream-3)] align-top",
        "transition-colors duration-100 group relative",
        isOver && "bg-[rgba(212,175,55,0.12)] ring-1 ring-inset ring-[var(--gold)]",
        bookings.length === 0 && "cursor-pointer",
      )}
    >
      <div className="space-y-1.5 min-h-[56px]">
        {bookings.map((b) => <BookingCard key={b.id} booking={b} viewingStaffId={staffId} />)}
        {bookings.length === 0 && (
          <div className="hidden group-hover:flex items-center justify-center h-10 rounded-lg border border-dashed border-[var(--gold)] opacity-40 transition">
            <Plus size={14} className="text-[var(--gold)]" />
          </div>
        )}
      </div>
    </td>
  );
}
