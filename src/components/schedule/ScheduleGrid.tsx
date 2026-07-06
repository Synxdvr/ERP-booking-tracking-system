"use client";
import { useDroppable } from "@dnd-kit/core";
import { useState, useRef, useEffect } from "react";
import { Booking, Staff, StaffAttendance, TimeSlot, TIME_SLOTS, TIME_SLOT_LABELS } from "@/types";
import { useScheduleStore } from "@/lib/store";
import BookingCard from "./BookingCard";
import { cn } from "@/lib/utils";
import { Plus, LogIn, X, Moon, Undo2 } from "lucide-react";
import { isToday, format } from "date-fns";

interface Props {
  bookings: Booking[];
  staff: Staff[];
  attendance: StaffAttendance[];
  selectedDate: Date;
  isLoading: boolean;
  onCheckIn?: (staffId: string) => void;
  onMarkAbsent?: (staffId: string) => void;
  onMarkLeave?: (staffId: string) => void;
  onMarkDayOff?: (staffId: string) => void;
  onUndo?: (record: StaffAttendance) => void;
}

export default function ScheduleGrid({ bookings, staff, attendance, selectedDate, isLoading, onCheckIn, onMarkAbsent, onMarkLeave, onMarkDayOff, onUndo }: Props) {
  const { openNewBooking } = useScheduleStore();
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  // Attendance is only active for today — past/future use static sort_order
  const isAttendanceDay = isToday(selectedDate);

  // Build a lookup: staff_id → attendance record (today only)
  const attendanceMap = new Map<string, StaffAttendance>(
    attendance.map((a) => [a.staff_id, a])
  );

  // Sort staff for today:
  //   1. Checked-in (present) → ordered by arrival_order asc
  //   2. Not yet recorded → ordered by sort_order (static)
  //   3. Absent / on-leave → ordered by sort_order, pushed to the right
  const sortedStaff = isAttendanceDay
    ? [...staff].sort((a, b) => {
        const aRec = attendanceMap.get(a.id);
        const bRec = attendanceMap.get(b.id);

        const aAbsent = aRec?.status === "absent" || aRec?.status === "leave";
        const bAbsent = bRec?.status === "absent" || bRec?.status === "leave";

        // Absent always goes right
        if (aAbsent && !bAbsent) return 1;
        if (!aAbsent && bAbsent) return -1;

        // Both present/unchecked: checked-in first, then by arrival_order
        const aOrder = aRec?.status === "present" ? (aRec.arrival_order ?? 999) : 888;
        const bOrder = bRec?.status === "present" ? (bRec.arrival_order ?? 999) : 888;
        if (aOrder !== bOrder) return aOrder - bOrder;

        // Fallback to static sort_order
        return a.sort_order - b.sort_order;
      })
    : staff; // past/future: already ordered by sort_order from the API

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
            {sortedStaff.map((member) => {
              const rec = isAttendanceDay ? attendanceMap.get(member.id) : undefined;
              const isAbsent = rec?.status === "absent" || rec?.status === "leave";
              const isCheckedIn = rec?.status === "present";

              const isPopoverOpen = openPopover === member.id;

              return (
                <th
                  key={member.id}
                  className={cn(
                    "px-3 py-3 text-left border-b min-w-[170px] transition-colors relative",
                    isAbsent
                      ? "bg-[#374151] border-white/5"
                      : "bg-[var(--charcoal)] border-white/10"
                  )}
                >
                  <button
                    onClick={() => isAttendanceDay && setOpenPopover(isPopoverOpen ? null : member.id)}
                    className={cn(
                      "flex items-center gap-2 w-full text-left",
                      isAttendanceDay && "cursor-pointer"
                    )}
                  >
                    {/* Dynamic status icon */}
                    <StatusIcon
                      isAttendanceDay={isAttendanceDay}
                      rec={rec}
                      colorHex={member.color_hex}
                    />
                    <span
                      className={cn(
                        "text-[10px] tracking-widest uppercase font-semibold",
                        isAbsent ? "text-gray-400" : "text-[var(--gold)]"
                      )}
                    >
                      {member.name}
                    </span>
                  </button>

                  {/* Attendance popover — today only */}
                  {isAttendanceDay && isPopoverOpen && (
                    <AttendancePopover
                      member={member}
                      rec={rec}
                      onClose={() => setOpenPopover(null)}
                      onCheckIn={onCheckIn}
                      onMarkAbsent={onMarkAbsent}
                      onMarkLeave={onMarkLeave}
                      onMarkDayOff={onMarkDayOff}
                      onUndo={onUndo}
                    />
                  )}
                </th>
              );
            })}
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
              {sortedStaff.map((member) => {
                const rec = isAttendanceDay ? attendanceMap.get(member.id) : undefined;
                const isAbsent = rec?.status === "absent" || rec?.status === "leave";

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
                    isAbsent={isAbsent}
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


// ── Attendance Popover ────────────────────────────────────────────────────────
function AttendancePopover({
  member,
  rec,
  onClose,
  onCheckIn,
  onMarkAbsent,
  onMarkLeave,
  onMarkDayOff,
  onUndo,
}: {
  member: Staff;
  rec: StaffAttendance | undefined;
  onClose: () => void;
  onCheckIn?: (id: string) => void;
  onMarkAbsent?: (id: string) => void;
  onMarkLeave?: (id: string) => void;
  onMarkDayOff?: (id: string) => void;
  onUndo?: (record: StaffAttendance) => void;
}) {
  // Close on outside click
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);

  const isPresent = rec?.status === "present";
  const isAbsent  = rec?.status === "absent";
  const isLeave   = rec?.status === "leave";

  function act(fn?: (id: string) => void) {
    fn?.(member.id);
    onClose();
  }
  function actUndo(fn?: (r: StaffAttendance) => void) {
    if (rec) fn?.(rec);
    onClose();
  }

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full mt-1 z-50 w-44 rounded-xl border border-[var(--cream-3)] bg-white shadow-lg overflow-hidden"
      // Prevent the th click from immediately re-closing
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header strip with staff color */}
      <div
        className="px-3 py-2 flex items-center gap-2"
        style={{ backgroundColor: member.color_hex + "22" }}
      >
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: member.color_hex }}
        />
        <span className="text-[11px] font-bold text-[var(--charcoal)] tracking-wide uppercase truncate">
          {member.name}
        </span>
      </div>

      {/* Current status line */}
      <div className="px-3 py-1.5 border-b border-[var(--cream-3)]">
        {!rec && (
          <p className="text-[10px] text-gray-400 font-medium">No status set</p>
        )}
        {isPresent && rec && (
          <p className="text-[10px] text-green-600 font-semibold">
            #{rec.arrival_order} · Clocked in at {format(new Date(rec.arrived_at!), "h:mm a")}
          </p>
        )}
        {isAbsent && (
          <p className="text-[10px] text-red-500 font-semibold">Absent</p>
        )}
        {isLeave && rec?.notes === "day_off" && (
          <p className="text-[10px] text-amber-600 font-semibold">Day Off</p>
        )}
        {isLeave && rec?.notes !== "day_off" && (
          <p className="text-[10px] text-purple-600 font-semibold">On Leave</p>
        )}
      </div>

      {/* Actions */}
      <div className="p-2 space-y-1">
        {/* Clock In — always show if not already clocked in */}
        {!isPresent && (
          <button
            onClick={() => act(onCheckIn)}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[var(--gold)] hover:bg-[var(--gold-dark)] text-white text-[11px] font-semibold transition"
          >
            <LogIn size={12} /> Clock In
          </button>
        )}
        {/* Non-present options — show when not recorded OR allow switching */}
        {!isPresent && (
          <>
            <button
              onClick={() => act(onMarkAbsent)}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-semibold transition"
            >
              <X size={12} /> Absent
            </button>
            <button
              onClick={() => act(onMarkLeave)}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-semibold transition"
            >
              <Moon size={12} /> On Leave
            </button>
            <button
              onClick={() => act(onMarkDayOff)}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-semibold transition"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0"><circle cx="6" cy="6" r="3" fill="currentColor"/><line x1="6" y1="0.5" x2="6" y2="2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><line x1="6" y1="9.5" x2="6" y2="11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><line x1="0.5" y1="6" x2="2.5" y2="6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><line x1="9.5" y1="6" x2="11.5" y2="6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              Day Off
            </button>
          </>
        )}
        {/* Undo — always show when any status is set */}
        {rec && (
          <button
            onClick={() => actUndo(onUndo)}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 text-[11px] font-semibold transition border border-gray-100"
          >
            <Undo2 size={12} /> Reset Status
          </button>
        )}
      </div>
    </div>
  );
}


// ── Status icon — replaces the old static color dot ──────────────────────────
// · Not an attendance day (past/future) → solid color circle (old dot, slightly larger)
// · Today, checked in (present)          → solid color circle
// · Today, not yet recorded              → clock SVG (waiting)
// · Today, absent or on leave            → X mark SVG
function StatusIcon({
  isAttendanceDay,
  rec,
  colorHex,
}: {
  isAttendanceDay: boolean;
  rec: StaffAttendance | undefined;
  colorHex: string;
}) {
  // Past / future date — plain color dot, no attendance context
  if (!isAttendanceDay) {
    return (
      <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: colorHex }}
      />
    );
  }

  // Today — checked in: solid color circle
  if (rec?.status === "present") {
    return (
      <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-white/30"
        style={{ backgroundColor: colorHex }}
      />
    );
  }

  // Today — absent or on leave: X mark
  if (rec?.status === "absent" || rec?.status === "leave") {
    return (
      <svg
        width="11"
        height="11"
        viewBox="0 0 11 11"
        fill="none"
        className="flex-shrink-0"
        aria-label={rec.status === "leave" ? "On leave" : "Absent"}
      >
        <line x1="1.5" y1="1.5" x2="9.5" y2="9.5" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
        <line x1="9.5" y1="1.5" x2="1.5" y2="9.5" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  // Today — not yet checked in: clock SVG
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 11 11"
      fill="none"
      className="flex-shrink-0"
      aria-label="Not checked in"
    >
      <circle cx="5.5" cy="5.5" r="4.5" stroke="#6b7280" strokeWidth="1.2" />
      {/* Hour hand pointing to ~12 */}
      <line x1="5.5" y1="5.5" x2="5.5" y2="2.5" stroke="#6b7280" strokeWidth="1.2" strokeLinecap="round" />
      {/* Minute hand pointing to ~3 */}
      <line x1="5.5" y1="5.5" x2="8" y2="5.5" stroke="#6b7280" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}



function SlotCell({ slot, staffId, bookings, isAbsent, onAddClick }: {
  slot: TimeSlot;
  staffId: string;
  bookings: Booking[];
  isAbsent: boolean;
  onAddClick: () => void;
}) {
  const droppableId = `${slot}::${staffId}`;
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });

  return (
    <td
      ref={setNodeRef}
      onClick={!isAbsent && bookings.length === 0 ? onAddClick : undefined}
      className={cn(
        "slot-cell px-2 py-2 border-b border-[var(--cream-3)] align-top",
        "transition-colors duration-100 group relative",
        isOver && !isAbsent && "bg-[rgba(212,175,55,0.12)] ring-1 ring-inset ring-[var(--gold)]",
        !isAbsent && bookings.length === 0 && "cursor-pointer",
        isAbsent && "bg-[#f3f4f6] cursor-not-allowed",
      )}
    >
      {isAbsent ? (
        // Subtle diagonal stripe overlay for absent columns
        <div
          className="min-h-[56px] rounded opacity-40"
          style={{
            backgroundImage: "repeating-linear-gradient(45deg, #d1d5db 0, #d1d5db 1px, transparent 0, transparent 50%)",
            backgroundSize: "6px 6px",
          }}
        >
          {/* Still render any pre-existing bookings so admin can see + reassign */}
          {bookings.length > 0 && (
            <div className="space-y-1.5 p-0.5">
              {bookings.map((b) => <BookingCard key={b.id} booking={b} viewingStaffId={staffId} />)}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-1.5 min-h-[56px]">
          {bookings.map((b) => <BookingCard key={b.id} booking={b} viewingStaffId={staffId} />)}
          {bookings.length === 0 && (
            <div className="hidden group-hover:flex items-center justify-center h-10 rounded-lg border border-dashed border-[var(--gold)] opacity-40 transition">
              <Plus size={14} className="text-[var(--gold)]" />
            </div>
          )}
        </div>
      )}
    </td>
  );
}
