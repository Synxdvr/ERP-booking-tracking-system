"use client";
import { useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useScheduleStore } from "@/lib/store";
import { format } from "date-fns";
import { Booking, Room, Staff } from "@/types";

export function useBookings() {
  const { selectedDate, setBookings, setRooms, setStaff, setLoading, upsertBooking, removeBooking } =
    useScheduleStore();
  const supabase = createClient();
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
  }, [dateStr]);

  const fetchRooms = useCallback(async () => {
    const { data } = await supabase
      .from("rooms")
      .select("*")
      .eq("is_active", true)
      .order("name");
    if (data) setRooms(data as Room[]);
  }, []);

  const fetchStaff = useCallback(async () => {
    const { data } = await supabase
      .from("staff")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (data) setStaff(data as Staff[]);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchBookings();
    fetchRooms();
    fetchStaff();
  }, [fetchBookings]);

  useEffect(() => {
    fetchStaff();
  }, []);

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

    return () => { supabase.removeChannel(channel); };
  }, [dateStr]);

  return { refetch: fetchBookings, refetchStaff: fetchStaff };
}
