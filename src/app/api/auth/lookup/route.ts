import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// This route is intentionally unauthenticated — it only returns an email
// for a given display_name so the login page can resolve usernames.
// Uses service role to bypass RLS on the users table.
export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username");
  if (!username) return NextResponse.json({ error: "username required" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("users")
    .select("email")
    .ilike("display_name", username.trim())
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Username not found." }, { status: 404 });
  }

  return NextResponse.json({ email: data.email });
}
