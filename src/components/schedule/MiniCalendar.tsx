"use client";
import { useState } from "react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, addMonths, subMonths, getDay
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useScheduleStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function MiniCalendar() {
  const { selectedDate, setSelectedDate } = useScheduleStore();
  const [viewMonth, setViewMonth] = useState(new Date());
  const today = new Date();

  const days = eachDayOfInterval({ start: startOfMonth(viewMonth), end: endOfMonth(viewMonth) });
  const startPad = getDay(startOfMonth(viewMonth));

  function goToday() {
    setSelectedDate(today);
    setViewMonth(today);
  }

  return (
    <div className="bg-white rounded-2xl border border-[var(--cream-3)] p-4 select-none">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setViewMonth(subMonths(viewMonth, 1))}
          className="p-1.5 rounded-lg hover:bg-[var(--cream-3)] transition">
          <ChevronLeft size={15} className="text-[var(--charcoal-mid)]" />
        </button>
        <span className="text-xs font-semibold tracking-widest uppercase text-[var(--charcoal)]">
          {format(viewMonth, "MMMM yyyy")}
        </span>
        <button onClick={() => setViewMonth(addMonths(viewMonth, 1))}
          className="p-1.5 rounded-lg hover:bg-[var(--cream-3)] transition">
          <ChevronRight size={15} className="text-[var(--charcoal-mid)]" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d, i) => (
          <div key={i} className="text-center text-[10px] text-[var(--charcoal-mid)] font-semibold py-1 tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday    = isSameDay(day, today);
          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={cn(
                "aspect-square w-full flex items-center justify-center text-xs rounded-lg transition font-medium",
                isSelected && "bg-[var(--gold)] text-white shadow-sm",
                !isSelected && isToday && "text-[var(--gold)] ring-1 ring-[var(--gold)]",
                !isSelected && !isToday && "hover:bg-[var(--cream-3)] text-[var(--charcoal)]",
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>

      {/* Go to today button */}
      {!isSameDay(selectedDate, today) && (
        <button
          onClick={goToday}
          className="mt-3 w-full py-1.5 rounded-lg text-[10px] tracking-widest uppercase font-medium text-[var(--gold)] border border-[var(--gold)] hover:bg-[var(--gold)] hover:text-white transition"
        >
          Go to Today
        </button>
      )}
    </div>
  );
}
