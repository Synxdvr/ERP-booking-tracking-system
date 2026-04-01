import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col">
      {/* Top nav */}
      <header className="bg-[var(--charcoal)] text-white h-14 flex items-center px-6 justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <span className="font-serif text-xl text-[var(--gold)]">S&apos;thetic</span>
          <span className="text-charcoal-200 text-xs tracking-widest uppercase hidden sm:block">Systems</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-charcoal-200 hidden md:block">{user.email}</span>
          <form action="/api/auth/signout" method="POST">
            <button className="text-xs tracking-widest uppercase text-charcoal-200 hover:text-[var(--gold)] transition">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
