import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { checkConflict } from "@/lib/conflict";
import { Booking, BookingStatus, isValidTransition, Room, SLOT_TIMES, TimeSlot, UpdateBookingPayload } from "@/types";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: UpdateBookingPayload = await req.json();
  const { id } = params;

  // ── Status transition validation ──────────────────────────────────────────
  if (body.status !== undefined) {
    const { data: current, error: fetchErr } = await supabase
      .from("bookings")
      .select("status")
      .eq("id", id)
      .single();

    if (fetchErr || !current) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (!isValidTransition(current.status as BookingStatus, body.status)) {
      return NextResponse.json(
        { error: `Invalid status transition: ${current.status} → ${body.status}` },
        { status: 422 }
      );
    }
  }

  // ── Conflict check (unchanged from original) ──────────────────────────────
  if (body.booked_slot || body.room_id || body.services) {
    const { data: current } = await supabase
      .from("bookings")
      .select("*, booking_services(staff_id)")
      .eq("id", id)
      .single();

    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const checkDate  = body.date        ?? current.date;
    const checkSlot  = body.booked_slot ?? current.booked_slot;
    const checkRoom  = body.room_id     ?? current.room_id;
    const checkStaff = body.services?.map(s => s.staff_id)
      ?? current.booking_services.map((s: { staff_id: string }) => s.staff_id);

    const { data: rooms }    = await supabase.from("rooms").select("*");
    const { data: existing } = await supabase
      .from("bookings")
      .select("*, booking_services(staff_id, staff:staff(name))")
      .eq("date", checkDate)
      .eq("booked_slot", checkSlot)
      .neq("status", "cancelled");

    const conflict = checkConflict(
      { date: checkDate, booked_slot: checkSlot, room_id: checkRoom, staff_ids: checkStaff, exclude_booking_id: id },
      (existing ?? []) as Booking[],
      (rooms ?? []) as Room[]
    );

    if (conflict.hasConflict) {
      return NextResponse.json(
        { error: conflict.conflictDetail, conflictType: conflict.conflictType },
        { status: 409 }
      );
    }
  }

  // ── Auto-populate slot times when booked_slot changes ────────────────────
  const slotKey = body.booked_slot as TimeSlot | undefined;
  if (slotKey && SLOT_TIMES[slotKey]) {
    const { start, end } = SLOT_TIMES[slotKey];
    body.slot_start_time = `${start}:00+08`;
    body.slot_end_time   = `${end}:00+08`;
  }

  const { services, ...bookingFields } = body;

  const { data: updated, error } = await supabase
    .from("bookings")
    .update({ ...bookingFields, updated_by: user.id, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, room:rooms(*), booking_services(*, staff:staff(*))")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (services !== undefined) {
    await supabase.from("booking_services").delete().eq("booking_id", id);
    if (services.length > 0) {
      await supabase.from("booking_services").insert(
        services.map(s => ({ booking_id: id, staff_id: s.staff_id, service_name: s.service_name }))
      );
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.from("bookings").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}