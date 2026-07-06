import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("staff")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Validate required fields
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "name is required." }, { status: 400 });
  if (name.length > 50) return NextResponse.json({ error: "name must be 50 characters or fewer." }, { status: 400 });

  const colorHex = typeof body.color_hex === "string" ? body.color_hex.trim() : "#D4AF37";
  if (!/^#[0-9A-Fa-f]{6}$/.test(colorHex)) {
    return NextResponse.json({ error: "color_hex must be a valid hex colour (e.g. #BE6B7A)." }, { status: 400 });
  }

  const sort_order = typeof body.sort_order === "number" ? body.sort_order : 999;

  const { data, error } = await supabase
    .from("staff")
    .insert({ name, color_hex: colorHex, sort_order })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const order: string[] = body?.order;

  if (!Array.isArray(order) || order.length === 0) {
    return NextResponse.json({ error: "order array required" }, { status: 400 });
  }

  // Run all sort_order updates in parallel instead of one-by-one
  const updates = await Promise.all(
    order.map((id, i) =>
      supabase.from("staff").update({ sort_order: i + 1 }).eq("id", id)
    )
  );

  const firstError = updates.find(({ error }) => error);
  if (firstError?.error) {
    return NextResponse.json(
      { error: `Failed to update order: ${firstError.error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
