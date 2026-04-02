import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ManageLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col">
      <header className="bg-[var(--charcoal)] text-white h-14 flex items-center px-6 justify-between flex-shrink-0">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-serif text-xl text-[var(--gold)]">S&apos;thetic</Link>
          <nav className="flex items-center gap-1">
            <NavLink href="/dashboard">Schedule</NavLink>
            <NavLink href="/manage/rooms">Rooms</NavLink>
            <NavLink href="/manage/staff">Staff</NavLink>
          </nav>
        </div>
        <form action="/api/auth/signout" method="POST">
          <button className="text-xs tracking-widest uppercase text-charcoal-200 hover:text-[var(--gold)] transition">
            Sign out
          </button>
        </form>
      </header>
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">{children}</main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href}
      className="px-3 py-1.5 rounded-lg text-xs tracking-widest uppercase text-charcoal-200 hover:text-[var(--gold)] hover:bg-white/5 transition">
      {children}
    </Link>
  );
}
