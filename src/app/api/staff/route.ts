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
  const { data, error } = await supabase.from("staff").insert(body).select().single();
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

  // Update each row individually — only touching sort_order
  for (let i = 0; i < order.length; i++) {
    const { error } = await supabase
      .from("staff")
      .update({ sort_order: i + 1 })
      .eq("id", order[i]);

    if (error) {
      console.error(`sort_order update failed for id ${order[i]}:`, error.message, error.code, error.hint);
      return NextResponse.json(
        { error: `Failed to update staff ${order[i]}: ${error.message}` },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ success: true });
}
