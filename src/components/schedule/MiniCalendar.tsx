"use client";
import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, getDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useScheduleStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function MiniCalendar() {
  const { selectedDate, setSelectedDate, bookings } = useScheduleStore();
  const [viewMonth, setViewMonth] = useState(new Date());

  const days = eachDayOfInterval({ start: startOfMonth(viewMonth), end: endOfMonth(viewMonth) });
  const startPad = getDay(startOfMonth(viewMonth)); // 0=Sun

  return (
    <div className="bg-white rounded-2xl border border-[var(--cream-3)] p-4 select-none">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setViewMonth(subMonths(viewMonth, 1))}
          className="p-1 rounded-lg hover:bg-[var(--cream-3)] transition">
          <ChevronLeft size={14} className="text-[var(--charcoal-mid)]" />
        </button>
        <span className="text-xs font-medium tracking-widest uppercase text-[var(--charcoal)]">
          {format(viewMonth, "MMM yyyy")}
        </span>
        <button onClick={() => setViewMonth(addMonths(viewMonth, 1))}
          className="p-1 rounded-lg hover:bg-[var(--cream-3)] transition">
          <ChevronRight size={14} className="text-[var(--charcoal-mid)]" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {["S","M","T","W","T","F","S"].map((d, i) => (
          <div key={i} className="text-center text-[10px] text-[var(--charcoal-mid)] font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          return (
            <button key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={cn(
                "aspect-square w-full flex items-center justify-center text-xs rounded-lg transition",
                isSelected && "bg-[var(--gold)] text-white font-medium",
                !isSelected && isToday && "text-[var(--gold)] font-semibold",
                !isSelected && !isToday && "hover:bg-[var(--cream-3)] text-[var(--charcoal)]",
              )}>
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
