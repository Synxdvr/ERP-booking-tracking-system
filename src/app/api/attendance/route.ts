import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/attendance?date=YYYY-MM-DD
// Returns all attendance rows for the given date.
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const date = req.nextUrl.searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "date query param required (YYYY-MM-DD)" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("staff_attendance")
    .select("*")
    .eq("date", date)
    .order("arrival_order", { ascending: true, nullsFirst: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/attendance
// Check in a staff member for today. Creates the row if it doesn't exist;
// if the staff member was previously marked absent/leave, switches them to present.
// Body: { date: string; staff_id: string; notes?: string }
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const date: string = body?.date;
  const staff_id: string = body?.staff_id;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "date is required (YYYY-MM-DD)" }, { status: 400 });
  }
  if (!staff_id) {
    return NextResponse.json({ error: "staff_id is required" }, { status: 400 });
  }

  // Count how many staff have already checked in today to get the next arrival_order
  const { count } = await supabase
    .from("staff_attendance")
    .select("*", { count: "exact", head: true })
    .eq("date", date)
    .eq("status", "present");

  const arrival_order = (count ?? 0) + 1;

  const { data, error } = await supabase
    .from("staff_attendance")
    .upsert(
      {
        date,
        staff_id,
        status: "present",
        arrived_at: new Date().toISOString(),
        arrival_order,
        notes: body?.notes ?? null,
      },
      { onConflict: "date,staff_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/attendance
// Mark a staff member as absent or on leave (no check-in time).
// Body: { date: string; staff_id: string; status: "absent" | "leave"; notes?: string }
export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { date, staff_id, status, notes } = body ?? {};

  if (!date || !staff_id || !["absent", "leave"].includes(status)) {
    return NextResponse.json({ error: "date, staff_id, and status (absent|leave) are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("staff_attendance")
    .upsert(
      { date, staff_id, status, arrived_at: null, arrival_order: null, notes: notes ?? null },
      { onConflict: "date,staff_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
