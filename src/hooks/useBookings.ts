"use client";
import { useEffect, useCallback, useRef } from "react";
import { isToday } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { useScheduleStore } from "@/lib/store";
import { format } from "date-fns";
import { Booking, Room, Staff, StaffAttendance } from "@/types";

export function useBookings() {
  const {
    selectedDate,
    setBookings,
    setRooms,
    setStaff,
    setAttendance,
    upsertAttendance,
    setLoading,
    upsertBooking,
    removeBooking,
  } = useScheduleStore();

  // Stable client ref — avoids recreating on every render
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bookings")
      .select("*, room:rooms(*), booking_services(*, staff:staff(*))")
      .eq("date", dateStr)
      .order("booked_slot");
    if (!error && data) setBookings(data as Booking[]);
    setLoading(false);
  }, [dateStr, setBookings, setLoading, supabase]);

  const fetchRooms = useCallback(async () => {
    const { data } = await supabase
      .from("rooms")
      .select("*")
      .eq("is_active", true)
      .order("name");
    if (data) setRooms(data as Room[]);
  }, [setRooms, supabase]);

  const fetchStaff = useCallback(async () => {
    const { data } = await supabase
      .from("staff")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (data) setStaff(data as Staff[]);
  }, [setStaff, supabase]);

  // Fetch attendance only for today's date — past/future use static sort_order
  const fetchAttendance = useCallback(async (dateStr: string) => {
    if (!isToday(new Date(dateStr + "T00:00:00"))) {
      setAttendance([]);
      return;
    }
    const res = await fetch(`/api/attendance?date=${dateStr}`);
    if (res.ok) setAttendance((await res.json()) as StaffAttendance[]);
  }, [setAttendance]);

  // Fetch all on initial mount — rooms & staff are date-independent
  useEffect(() => {
    fetchRooms();
    fetchStaff();
  }, [fetchRooms, fetchStaff]);

  // Re-fetch bookings + attendance whenever the selected date changes
  useEffect(() => {
    fetchBookings();
    fetchAttendance(dateStr);
  }, [fetchBookings, fetchAttendance, dateStr]);

  // Realtime subscription — scoped to the current date
  useEffect(() => {
    const channel = supabase
      .channel(`bookings:${dateStr}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `date=eq.${dateStr}` },
        async (payload) => {
          if (payload.eventType === "DELETE") {
            removeBooking(payload.old.id as string);
          } else {
            const { data } = await supabase
              .from("bookings")
              .select("*, room:rooms(*), booking_services(*, staff:staff(*))")
              .eq("id", (payload.new as { id: string }).id)
              .single();
            if (data) upsertBooking(data as Booking);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dateStr, supabase, upsertBooking, removeBooking]);

  // Realtime subscription for attendance (today only)
  useEffect(() => {
    if (!isToday(new Date(dateStr + "T00:00:00"))) return;

    const channel = supabase
      .channel(`attendance:${dateStr}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "staff_attendance", filter: `date=eq.${dateStr}` },
        async (payload) => {
          if (payload.eventType === "DELETE") {
            // Remove from store by re-fetching (deleted row has no new state)
            const res = await fetch(`/api/attendance?date=${dateStr}`);
            if (res.ok) setAttendance((await res.json()) as StaffAttendance[]);
          } else {
            upsertAttendance(payload.new as StaffAttendance);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dateStr, supabase, setAttendance, upsertAttendance]);

  return { refetch: fetchBookings, refetchStaff: fetchStaff };
}
