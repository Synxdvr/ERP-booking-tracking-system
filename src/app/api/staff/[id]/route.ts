import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Validate only the fields that are present
  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return NextResponse.json({ error: "name cannot be empty." }, { status: 400 });
    if (name.length > 50) return NextResponse.json({ error: "name must be 50 characters or fewer." }, { status: 400 });
    body.name = name;
  }

  if (body.color_hex !== undefined) {
    const colorHex = typeof body.color_hex === "string" ? body.color_hex.trim() : "";
    if (!/^#[0-9A-Fa-f]{6}$/.test(colorHex)) {
      return NextResponse.json({ error: "color_hex must be a valid hex colour (e.g. #BE6B7A)." }, { status: 400 });
    }
    body.color_hex = colorHex;
  }

  const { data, error } = await supabase
    .from("staff")
    .update(body)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Soft delete
  const { error } = await supabase
    .from("staff")
    .update({ is_active: false })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
