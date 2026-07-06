import Link from "next/link";

/**
 * Shared app header — rendered server-side in both DashboardLayout and ManageLayout.
 * Accepts the current user's email (already fetched by the parent layout) so we
 * don't fire a second Supabase round-trip just for the email display.
 */
export default function AppHeader({ email }: { email?: string }) {
  return (
    <header className="bg-[var(--charcoal)] text-white h-14 flex items-center px-6 justify-between flex-shrink-0 z-20">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="font-serif text-xl text-[var(--gold)]">
          S&apos;thetic
        </Link>
        <nav className="flex items-center gap-1">
          <NavLink href="/dashboard">Schedule</NavLink>
          <NavLink href="/manage/rooms">Rooms</NavLink>
          <NavLink href="/manage/staff">Staff</NavLink>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        {email && (
          <span className="text-xs text-charcoal-200 hidden md:block">{email}</span>
        )}
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="text-xs tracking-widest uppercase text-charcoal-200 hover:text-[var(--gold)] transition"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-lg text-xs tracking-widest uppercase text-charcoal-200 hover:text-[var(--gold)] hover:bg-white/5 transition"
    >
      {children}
    </Link>
  );
}
