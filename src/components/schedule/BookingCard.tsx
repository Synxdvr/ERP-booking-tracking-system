"use client";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Booking } from "@/types";
import { useScheduleStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, { border: string; bg: string; dot: string; text: string; sub: string }> = {
  tentative:  { border: "border-amber-400",       bg: "bg-amber-50",      dot: "bg-amber-400",    text: "text-amber-900",  sub: "text-amber-700" },
  confirmed:  { border: "border-[var(--gold)]",   bg: "bg-[var(--cream-3)]", dot: "bg-[var(--gold)]", text: "text-[var(--charcoal)]", sub: "text-[var(--charcoal-mid)]" },
  ongoing:    { border: "border-blue-500",        bg: "bg-blue-50",       dot: "bg-blue-500",     text: "text-blue-900",   sub: "text-blue-700" },
  done:       { border: "border-gray-300",        bg: "bg-gray-50",       dot: "bg-gray-400",     text: "text-gray-500",   sub: "text-gray-400" },
  cancelled:  { border: "border-red-300",         bg: "bg-red-50",        dot: "bg-red-400",      text: "text-red-400",    sub: "text-red-300" },
};

export default function BookingCard({ booking }: { booking: Booking }) {
  const { openEditBooking } = useScheduleStore();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: booking.id });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  const services = booking.booking_services ?? [];
  const s = STATUS_STYLES[booking.status] ?? STATUS_STYLES.confirmed;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => { e.stopPropagation(); openEditBooking(booking); }}
      className={cn(
        "relative border-l-[3px] border border-r border-t border-b rounded-lg px-2.5 py-2 cursor-pointer transition select-none group",
        "hover:shadow-md hover:-translate-y-px",
        s.border, s.bg,
        isDragging && "opacity-40 shadow-xl scale-95 z-50",
      )}
    >
      {/* Status dot */}
      <span className={cn("absolute top-2 right-2 w-1.5 h-1.5 rounded-full", s.dot)} />

      {/* Client name */}
      <p className={cn("font-semibold text-xs leading-tight truncate pr-3", s.text)}>
        {booking.client_name}
      </p>

      {/* Therapist + service lines */}
      {services.length > 0 && (
        <div className="mt-1 space-y-0.5">
          {services.slice(0, 3).map((svc) => (
            <p key={svc.id} className={cn("text-[10px] leading-tight truncate", s.sub)}>
              <span className="font-medium">{svc.staff?.name ?? "—"}</span>
              {svc.service_name ? ` · ${svc.service_name}` : ""}
            </p>
          ))}
          {services.length > 3 && (
            <p className={cn("text-[10px] opacity-60", s.sub)}>+{services.length - 3} more</p>
          )}
        </div>
      )}

      {/* Actual times if logged */}
      {booking.time_started && (
        <p className={cn("text-[10px] mt-1 opacity-60", s.sub)}>
          {booking.time_started}{booking.time_finished ? ` → ${booking.time_finished}` : ""}
        </p>
      )}
    </div>
  );
}
