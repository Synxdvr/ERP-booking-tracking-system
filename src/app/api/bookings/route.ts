import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { checkConflict } from "@/lib/conflict";
import { Booking, CreateBookingPayload, Room, SLOT_TIMES, TimeSlot } from "@/types";

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const date = req.nextUrl.searchParams.get("date");
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

  const { data, error } = await supabase
    .from("bookings")
    .select("*, room:rooms(*), booking_services(*, staff:staff(*))")
    .eq("date", date)
    .order("booked_slot");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: CreateBookingPayload = await req.json();

  const { data: rooms } = await supabase.from("rooms").select("*");

  const { data: existing } = await supabase
    .from("bookings")
    .select("*, booking_services(staff_id, staff:staff(name))")
    .eq("date", body.date)
    .eq("booked_slot", body.booked_slot)
    .neq("status", "cancelled");

  const conflict = checkConflict(
    { date: body.date, booked_slot: body.booked_slot, room_id: body.room_id, staff_ids: body.services.map(s => s.staff_id) },
    (existing ?? []) as Booking[],
    (rooms ?? []) as Room[]
  );
  if (conflict.hasConflict) {
    return NextResponse.json({ error: conflict.conflictDetail, conflictType: conflict.conflictType }, { status: 409 });
  }


  const slotTimes = SLOT_TIMES[body.booked_slot as TimeSlot];
  const slot_start_time = slotTimes?.start ?? null;
  const slot_end_time   = slotTimes?.end   ?? null;

  // Insert booking
  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      date:             body.date,
      booked_slot:      body.booked_slot,
      slot_start_time,
      slot_end_time,
      client_name:      body.client_name,
      room_id:          body.room_id,
      status:           body.status ?? "confirmed",
      notes:            body.notes ?? null,
      created_by:       user.id,
      updated_by:       user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (body.services.length > 0) {
    await supabase.from("booking_services").insert(
      body.services.map(s => ({ booking_id: booking.id, staff_id: s.staff_id, service_name: s.service_name }))
    );
  }

  const { data: full } = await supabase
    .from("bookings")
    .select("*, room:rooms(*), booking_services(*, staff:staff(*))")
    .eq("id", booking.id)
    .single();

  return NextResponse.json(full ?? booking, { status: 201 });
}