"use client";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Booking } from "@/types";
import { useScheduleStore } from "@/lib/store";
import { cn } from "@/lib/utils";

// Status drives background + text color, but NOT the left border (that's therapist color)
const STATUS_BG: Record<string, { bg: string; text: string; sub: string; dot: string }> = {
  tentative: { bg: "bg-amber-50",          text: "text-amber-900",        sub: "text-amber-700",        dot: "bg-amber-400" },
  confirmed: { bg: "bg-[var(--cream-3)]",  text: "text-[var(--charcoal)]", sub: "text-[var(--charcoal-mid)]", dot: "bg-[var(--gold)]" },
  ongoing:   { bg: "bg-blue-50",           text: "text-blue-900",         sub: "text-blue-700",         dot: "bg-blue-500" },
  done:      { bg: "bg-gray-50",           text: "text-gray-500",         sub: "text-gray-400",         dot: "bg-gray-400" },
  cancelled: { bg: "bg-red-50",            text: "text-red-400",          sub: "text-red-300",          dot: "bg-red-400" },
};

const DEFAULT_BORDER = "#D4AF37"; // gold — used when multiple therapists or none

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

export default function BookingCard({ booking }: { booking: Booking }) {
  const { openEditBooking } = useScheduleStore();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: booking.id });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  const services = booking.booking_services ?? [];
  const s = STATUS_BG[booking.status] ?? STATUS_BG.confirmed;

  // Border color: use therapist color if exactly one therapist, else default gold
  const borderColor =
    services.length === 1 && services[0].staff?.color_hex
      ? services[0].staff.color_hex
      : DEFAULT_BORDER;

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, borderLeftColor: borderColor }}
      {...listeners}
      {...attributes}
      onClick={(e) => { e.stopPropagation(); openEditBooking(booking); }}
      className={cn(
        "relative border-l-[5px] border border-r border-t border-b border-r-transparent border-t-transparent border-b-transparent",
        "rounded-lg px-2.5 py-2 cursor-pointer transition select-none",
        "hover:shadow-md hover:-translate-y-px",
        s.bg,
        isDragging && "opacity-40 shadow-xl scale-95 z-50",
      )}
    >
      {/* Status dot */}
      <span className={cn("absolute top-2 right-2 w-1.5 h-1.5 rounded-full flex-shrink-0", s.dot)} />

      {/* Client name — bold, wraps if needed, max 2 lines */}
      <p className={cn("font-bold text-xs leading-tight break-words pr-3 line-clamp-2", s.text)}>
        {booking.client_name}
      </p>

      {/* Therapist + service lines */}
      {services.length > 0 && (
        <div className="mt-1 space-y-0.5">
          {services.slice(0, 3).map((svc, i) => (
            <p key={svc.id ?? i} className={cn("text-[10px] leading-tight break-words", s.sub)}>
              <span className="font-semibold">{truncate(svc.staff?.name ?? "—", 12)}</span>
              {svc.service_name ? ` · ${truncate(svc.service_name, 18)}` : ""}
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
