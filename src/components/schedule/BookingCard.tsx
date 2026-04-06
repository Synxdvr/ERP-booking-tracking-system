"use client";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Booking } from "@/types";
import { useScheduleStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const STATUS_BG: Record<string, { bg: string; text: string; sub: string; dot: string }> = {
  tentative: { bg: "bg-amber-50",           text: "text-amber-900",         sub: "text-amber-700",         dot: "bg-amber-400" },
  confirmed: { bg: "bg-[var(--cream-3)]",   text: "text-[var(--charcoal)]", sub: "text-[var(--charcoal-mid)]", dot: "bg-[var(--gold)]" },
  ongoing:   { bg: "bg-blue-50",            text: "text-blue-900",          sub: "text-blue-700",          dot: "bg-blue-500" },
  done:      { bg: "bg-gray-50",            text: "text-gray-500",          sub: "text-gray-400",          dot: "bg-gray-400" },
  cancelled: { bg: "bg-red-50",             text: "text-red-400",           sub: "text-red-300",           dot: "bg-red-400" },
};

const DEFAULT_BORDER = "#D4AF37";

function trunc(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

export default function BookingCard({ booking, viewingStaffId }: {
  booking: Booking;
  viewingStaffId?: string;
}) {
  const { openEditBooking } = useScheduleStore();
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: booking.id });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  const services = booking.booking_services ?? [];
  const s = STATUS_BG[booking.status] ?? STATUS_BG.confirmed;

  // Border color: single therapist → their color, multiple → gold
  const borderColor =
    services.length === 1 && services[0].staff?.color_hex
      ? services[0].staff.color_hex
      : DEFAULT_BORDER;

  // The service for the therapist whose column this card is in
  const myService = viewingStaffId
    ? services.find(svc => svc.staff_id === viewingStaffId)
    : services[0];

  // Other therapists on the same booking (co-therapists)
  const otherServices = viewingStaffId
    ? services.filter(svc => svc.staff_id !== viewingStaffId)
    : services.slice(1);

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, borderLeftColor: borderColor }}
      {...listeners}
      {...attributes}
      onClick={(e) => { e.stopPropagation(); openEditBooking(booking); }}
      className={cn(
        "relative border-l-[4px] border border-[var(--cream-3)] rounded-lg px-2.5 py-2",
        "cursor-pointer transition select-none hover:shadow-md hover:-translate-y-px",
        s.bg,
        isDragging && "opacity-40 shadow-xl scale-95 z-50",
      )}
    >
      {/* Status dot */}
      <span className={cn("absolute top-2 right-2 w-1.5 h-1.5 rounded-full", s.dot)} />

      {/* Client name */}
      <p className={cn("font-bold text-xs leading-tight line-clamp-2 pr-3", s.text)}>
        {booking.client_name}
      </p>

      {/* This therapist's service */}
      {myService?.service_name && (
        <p className={cn("text-[10px] leading-tight mt-0.5 font-semibold break-words", s.sub)}>
          {trunc(myService.service_name, 24)}
        </p>
      )}

      {/* Room */}
      {booking.room?.name && (
        <p className={cn("text-[10px] leading-tight mt-0.5 font-medium opacity-70", s.sub)}>
          {trunc(booking.room.name, 18)}
        </p>
      )}

      {/* Co-therapists badge */}
      {otherServices.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {otherServices.slice(0, 2).map((svc, i) => (
            <span key={i}
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-white/60 border border-current"
              style={{ color: svc.staff?.color_hex ?? DEFAULT_BORDER }}>
              {trunc(svc.staff?.name ?? "?", 8)}
            </span>
          ))}
          {otherServices.length > 2 && (
            <span className={cn("text-[9px] opacity-60 font-medium", s.sub)}>+{otherServices.length - 2}</span>
          )}
        </div>
      )}

      {/* Actual times */}
      {booking.time_started && (
        <p className={cn("text-[10px] mt-1 opacity-60 font-medium", s.sub)}>
          {booking.time_started}{booking.time_finished ? ` → ${booking.time_finished}` : ""}
        </p>
      )}
    </div>
  );
}
