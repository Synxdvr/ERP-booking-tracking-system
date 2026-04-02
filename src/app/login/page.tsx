"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword]     = useState("");
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);
  const router  = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    let email = identifier.trim();

    // Username (no @) — resolve via server-side lookup that uses service role key
    if (!email.includes("@")) {
      const res = await fetch(`/api/auth/lookup?username=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Username not found.");
        setLoading(false);
        return;
      }
      email = data.email;
    }

    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });
    if (authErr) {
      setError("Incorrect password.");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-100 px-4">
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #D4AF37 1px, transparent 0)", backgroundSize: "32px 32px" }} />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-10">
          <span className="text-xs tracking-[0.3em] text-[var(--gold)] font-normal uppercase">Internal System</span>
          <h1 className="font-serif text-5xl font-semibold text-[var(--charcoal)] leading-tight mt-2">
            S&apos;thetic
          </h1>
          <p className="text-[var(--charcoal-mid)] text-sm tracking-widest uppercase mt-1 font-normal">
            Booking &amp; Scheduling
          </p>
          <div className="w-12 h-px bg-[var(--gold)] mx-auto mt-4" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[var(--cream-3)] p-8">

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs tracking-widest uppercase text-[var(--charcoal-mid)] mb-2 font-medium">
                Username
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[var(--cream-3)] border border-transparent focus:border-[var(--gold)] focus:bg-white outline-none transition text-sm text-[var(--charcoal)]"
                placeholder="username"
                maxLength={100}
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-xs tracking-widest uppercase text-[var(--charcoal-mid)] mb-2 font-medium">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[var(--cream-3)] border border-transparent focus:border-[var(--gold)] focus:bg-white outline-none transition text-sm text-[var(--charcoal)] font-medium"
                placeholder="••••••••"
                maxLength={200}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg border border-red-100 font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 rounded-xl bg-[var(--gold)] hover:bg-[var(--gold-dark)] text-white text-sm tracking-widest uppercase font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[var(--charcoal-mid)] mt-6 font-normal">
          S&apos;thetic Spa — Staff access only
        </p>
      </div>
    </div>
  );
}
