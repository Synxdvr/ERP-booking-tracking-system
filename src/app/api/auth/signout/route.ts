import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  await supabase.auth.signOut();
  // Use the incoming request's origin so it works on localhost AND any Vercel domain
  const origin = req.nextUrl.origin;
  return NextResponse.redirect(new URL("/login", origin), { status: 302 });
}
