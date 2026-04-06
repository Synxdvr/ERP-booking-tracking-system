"use client";
import { DndContext, DragEndEvent, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { format } from "date-fns";
import { useScheduleStore } from "@/lib/store";
import { useBookings } from "@/hooks/useBookings";
import ScheduleGrid from "./ScheduleGrid";
import MiniCalendar from "./MiniCalendar";
import BookingModal from "../booking/BookingModal";
import { Booking, TimeSlot } from "@/types";
import { checkConflict } from "@/lib/conflict";
import { CalendarDays, Users, DoorOpen } from "lucide-react";

export default function DashboardClient() {
  const { selectedDate, bookings, rooms, staff, isLoading, upsertBooking } = useScheduleStore();
  useBookings();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 6 } })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const [newSlot, newStaffId] = (over.id as string).split("::");
    if (!newSlot || !newStaffId) return;

    const booking = bookings.find(b => b.id === active.id) as Booking;
    if (!booking) return;

    const conflict = checkConflict(
      {
        date: booking.date,
        booked_slot: newSlot as TimeSlot,
        room_id: booking.room_id,
        staff_ids: [newStaffId],
        exclude_booking_id: booking.id,
      },
      bookings,
      rooms
    );
    if (conflict.hasConflict) {
      alert(`⚠️ ${conflict.conflictDetail}`);
      return;
    }

    const updatedServices = (booking.booking_services ?? []).map(s => ({
      staff_id: newStaffId,
      service_name: s.service_name,
    }));

    const res = await fetch(`/api/bookings/${booking.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booked_slot: newSlot, services: updatedServices }),
    });
    if (res.ok) upsertBooking(await res.json());
  }

  const activeBookings = bookings.filter(b => b.status !== "cancelled");
  const roomsInUse     = new Set(activeBookings.map(b => b.room_id)).size;
  const staffOnDuty    = new Set(bookings.flatMap(b => (b.booking_services ?? []).map(s => s.staff_id))).size;

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex h-[calc(100vh-56px)] overflow-hidden">

        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0 border-r border-[var(--cream-3)] bg-[var(--cream-2)] p-4 overflow-y-auto flex flex-col gap-4">
          <MiniCalendar />
          <div className="text-center">
            <p className="font-serif text-lg text-[var(--charcoal)] font-semibold">{format(selectedDate, "EEEE")}</p>
            <p className="text-xs text-[var(--charcoal-mid)] font-medium">{format(selectedDate, "MMMM d, yyyy")}</p>
          </div>
          <div className="space-y-2">
            <StatCard icon={<CalendarDays size={13}/>} label="Bookings today"  value={activeBookings.length} />
            <StatCard icon={<Users size={13}/>}        label="Staff on duty"   value={staffOnDuty} />
            <StatCard icon={<DoorOpen size={13}/>}     label="Rooms in use"    value={roomsInUse} />
          </div>
        </aside>

        {/* Main grid area */}
        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--cream-3)] bg-white flex-shrink-0">
            <h1 className="font-serif text-lg text-[var(--charcoal)] font-semibold">
              Schedule — {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </h1>
            <button
              onClick={() => useScheduleStore.getState().openNewBooking()}
              className="px-4 py-2 rounded-xl bg-[var(--gold)] hover:bg-[var(--gold-dark)] text-white text-xs tracking-widest uppercase font-semibold transition"
            >
              + New Booking
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            <ScheduleGrid bookings={bookings} staff={staff} isLoading={isLoading} />
          </div>
        </main>
      </div>

      <BookingModal />
    </DndContext>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-[var(--cream-3)] px-3 py-2.5 flex items-center gap-2.5">
      <span className="text-[var(--gold)]">{icon}</span>
      <div>
        <p className="text-xs font-bold text-[var(--charcoal)]">{value}</p>
        <p className="text-[10px] text-[var(--charcoal-mid)] font-medium">{label}</p>
      </div>
    </div>
  );
}
