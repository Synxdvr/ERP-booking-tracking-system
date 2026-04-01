"use client";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Booking } from "@/types";
import { useScheduleStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  tentative:  "border-amber-300  bg-amber-50   text-amber-900",
  confirmed:  "border-[var(--gold)] bg-[var(--cream-3)] text-[var(--charcoal)]",
  ongoing:    "border-blue-400   bg-blue-50    text-blue-900",
  done:       "border-gray-300   bg-gray-50    text-gray-500",
  cancelled:  "border-red-200    bg-red-50     text-red-400   opacity-60",
};

export default function BookingCard({ booking }: { booking: Booking }) {
  const { openEditBooking } = useScheduleStore();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: booking.id });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  const services = booking.booking_services ?? [];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => { e.stopPropagation(); openEditBooking(booking); }}
      className={cn(
        "relative border rounded-xl px-3 py-2 cursor-pointer transition select-none",
        "hover:shadow-md hover:-translate-y-px",
        STATUS_COLORS[booking.status] ?? STATUS_COLORS.confirmed,
        isDragging && "opacity-40 shadow-xl scale-95 z-50",
      )}
    >
      {/* Status dot */}
      {booking.status === "tentative" && (
        <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-amber-400" />
      )}

      {/* Client */}
      <p className="font-medium text-xs leading-tight truncate pr-3">{booking.client_name}</p>

      {/* Services */}
      {services.length > 0 && (
        <div className="mt-1 space-y-0.5">
          {services.slice(0, 2).map((s) => (
            <p key={s.id} className="text-[10px] opacity-70 truncate">
              {s.staff?.name && <span className="font-medium">{s.staff.name}: </span>}
              {s.service_name}
            </p>
          ))}
          {services.length > 2 && (
            <p className="text-[10px] opacity-50">+{services.length - 2} more</p>
          )}
        </div>
      )}

      {/* Actual times if logged */}
      {booking.time_started && (
        <p className="text-[10px] opacity-50 mt-1">
          {booking.time_started}{booking.time_finished ? ` → ${booking.time_finished}` : ""}
        </p>
      )}
    </div>
  );
}
