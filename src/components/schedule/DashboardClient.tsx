"use client";
import { useMemo, useState } from "react";
import { DndContext, DragEndEvent, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { format, isToday } from "date-fns";
import { useScheduleStore } from "@/lib/store";
import { useBookings } from "@/hooks/useBookings";
import ScheduleGrid from "./ScheduleGrid";
import MiniCalendar from "./MiniCalendar";
import BookingModal from "../booking/BookingModal";
import { Booking, TimeSlot, StaffAttendance } from "@/types";
import { checkConflict } from "@/lib/conflict";
import { CalendarDays, Users, DoorOpen } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { toast } from "@/components/ui/Toaster";

export default function DashboardClient() {
  const { selectedDate, bookings, rooms, staff, attendance, isLoading, upsertBooking, upsertAttendance, setAttendance } = useScheduleStore();
  useBookings();

  const [dragConflict, setDragConflict] = useState<string | null>(null);

  // State for absent-with-bookings warning
  const [absentWarning, setAbsentWarning] = useState<{
    staffId: string;
    staffName: string;
    status: "absent" | "leave";
    bookingCount: number;
  } | null>(null);

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
      setDragConflict(conflict.conflictDetail ?? "Booking conflict detected.");
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

  // ── Attendance actions ─────────────────────────────────────────────────────
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const isAttendanceDay = isToday(selectedDate);

  async function handleCheckIn(staffId: string) {
    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: todayStr, staff_id: staffId }),
    });
    if (res.ok) {
      upsertAttendance(await res.json());
      toast("Staff checked in.", "success");
    } else {
      toast("Failed to check in staff.", "error");
    }
  }

  function requestMarkAbsent(staffId: string, status: "absent" | "leave") {
    const member = staff.find(s => s.id === staffId);
    if (!member) return;
    const todayBookings = bookings.filter(b =>
      b.status !== "cancelled" &&
      (b.booking_services ?? []).some(s => s.staff_id === staffId)
    );
    if (todayBookings.length > 0) {
      setAbsentWarning({ staffId, staffName: member.name, status, bookingCount: todayBookings.length });
    } else {
      doMarkAbsent(staffId, status);
    }
  }

  async function doMarkAbsent(staffId: string, status: "absent" | "leave") {
    const res = await fetch("/api/attendance", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: todayStr, staff_id: staffId, status }),
    });
    if (res.ok) {
      upsertAttendance(await res.json());
      toast(`Staff marked as ${status === "leave" ? "on leave" : "absent"}.`, "success");
    } else {
      toast("Failed to update attendance.", "error");
    }
  }

  async function handleUndo(record: StaffAttendance) {
    const res = await fetch(`/api/attendance/${record.id}`, { method: "DELETE" });
    if (res.ok) {
      setAttendance(attendance.filter(a => a.id !== record.id));
      toast("Attendance cleared.", "success");
    } else {
      toast("Failed to clear attendance.", "error");
    }
  }

  // ── Derived stats ──────────────────────────────────────────────────────────
  const { bookingsToday, roomsInUse, presentCount } = useMemo(() => {
    const active = bookings.filter(b => b.status !== "cancelled");
    const presentIds = new Set(
      attendance.filter(a => a.status === "present").map(a => a.staff_id)
    );
    return {
      bookingsToday: new Set(active.map(b => b.client_name.trim().toLowerCase())).size,
      roomsInUse: new Set(active.map(b => b.room_id)).size,
      presentCount: isAttendanceDay ? presentIds.size : new Set(
        bookings.flatMap(b => (b.booking_services ?? []).map(s => s.staff_id))
      ).size,
    };
  }, [bookings, attendance, isAttendanceDay]);

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
            <StatCard icon={<CalendarDays size={13}/>} label="Bookings today"  value={bookingsToday} />
            <StatCard
              icon={<Users size={13}/>}
              label={isAttendanceDay ? "Present today" : "Staff on duty"}
              value={presentCount}
            />
            <StatCard icon={<DoorOpen size={13}/>} label="Rooms in use" value={roomsInUse} />
          </div>
        </aside>

        {/* Main grid area */}
        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto">
            <ScheduleGrid
              bookings={bookings}
              staff={staff}
              attendance={attendance}
              selectedDate={selectedDate}
              isLoading={isLoading}
              onCheckIn={isAttendanceDay ? handleCheckIn : undefined}
              onMarkAbsent={isAttendanceDay ? (id) => requestMarkAbsent(id, "absent") : undefined}
              onMarkLeave={isAttendanceDay ? (id) => requestMarkAbsent(id, "leave") : undefined}
              onMarkDayOff={isAttendanceDay ? (id) => requestMarkAbsent(id, "leave") : undefined}
              onUndo={isAttendanceDay ? handleUndo : undefined}
            />
          </div>
        </main>
      </div>

      <BookingModal />

      {/* Drag conflict alert */}
      <ConfirmModal
        open={dragConflict !== null}
        title="Booking Conflict"
        message={dragConflict ?? ""}
        confirmLabel="OK"
        onConfirm={() => setDragConflict(null)}
        onCancel={() => setDragConflict(null)}
      />

      {/* Absent-with-bookings warning */}
      <ConfirmModal
        open={absentWarning !== null}
        title={absentWarning?.status === "leave" ? "Mark On Leave?" : "Mark Absent?"}
        message={
          `${absentWarning?.staffName} has ${absentWarning?.bookingCount} active booking${(absentWarning?.bookingCount ?? 0) > 1 ? "s" : ""} today. ` +
          `Marking them as ${absentWarning?.status === "leave" ? "on leave" : "absent"} will gray out their column but won't cancel their bookings. ` +
          `You can reassign those bookings by dragging them to another therapist.`
        }
        confirmLabel={absentWarning?.status === "leave" ? "Mark On Leave" : "Mark Absent"}
        danger
        onConfirm={() => {
          if (absentWarning) doMarkAbsent(absentWarning.staffId, absentWarning.status);
          setAbsentWarning(null);
        }}
        onCancel={() => setAbsentWarning(null)}
      />
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
