"use client";
import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    window.location.href = "/skb-education-ecosystem/hub/";
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border shadow-xl p-8"
        style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold shadow-lg">
            SKB
          </div>
          <div>
            <div className="text-[16px] font-semibold">Sign in</div>
            <div className="bangla text-[12px]" style={{ color: "var(--text-muted)" }}>
              লগইন করুন
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-emerald-500/30"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}
              placeholder="you@school.edu.bd"
            />
          </div>
          <div>
            <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-emerald-500/30"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-[13px] text-rose-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 py-3 text-[14px] font-semibold text-white shadow-lg shadow-emerald-500/20 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in • লগইন"}
          </button>
        </form>

        <div className="mt-3 text-center text-[13px]">
          <Link href="/forgot-password" className="font-medium text-emerald-700 dark:text-emerald-300">
            Forgot password? • পাসওয়ার্ড ভুলে গেছেন?
          </Link>
        </div>

        <div className="mt-5 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-emerald-700 dark:text-emerald-300">
            Create institution →
          </Link>
        </div>

        <div className="mt-5 text-center">
          <Link href="/" className="text-[12px]" style={{ color: "var(--text-faint)" }}>
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
