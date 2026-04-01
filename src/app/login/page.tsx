"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Invalid email or password.");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-100 px-4">
      {/* Background texture */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #D4AF37 1px, transparent 0)", backgroundSize: "32px 32px" }} />

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-block mb-3">
            <span className="text-xs tracking-[0.3em] text-[var(--gold)] font-light uppercase">Internal System</span>
          </div>
          <h1 className="font-serif text-5xl font-semibold text-[var(--charcoal)] leading-tight">
            S&apos;thetic
          </h1>
          <p className="text-[var(--charcoal-mid)] text-sm tracking-widest uppercase mt-1 font-light">
            Booking & Scheduling
          </p>
          <div className="w-12 h-px bg-[var(--gold)] mx-auto mt-4" />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[var(--cream-3)] p-8">
          <h2 className="font-serif text-xl text-[var(--charcoal)] mb-6">Sign in to continue</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs tracking-widest uppercase text-[var(--charcoal-mid)] mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[var(--cream-3)] border border-transparent focus:border-[var(--gold)] focus:bg-white outline-none transition text-sm text-[var(--charcoal)] placeholder:text-[var(--charcoal-mid)]"
                placeholder="you@sthetic.com"
              />
            </div>

            <div>
              <label className="block text-xs tracking-widest uppercase text-[var(--charcoal-mid)] mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[var(--cream-3)] border border-transparent focus:border-[var(--gold)] focus:bg-white outline-none transition text-sm text-[var(--charcoal)] placeholder:text-[var(--charcoal-mid)]"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 rounded-xl bg-[var(--gold)] hover:bg-[var(--gold-dark)] text-white text-sm tracking-widest uppercase font-light transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[var(--charcoal-mid)] mt-6">
          S&apos;thetic Spa — Staff access only
        </p>
      </div>
    </div>
  );
}
