"use client";
import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const redirectTo = window.location.origin + "/skb-education-ecosystem/reset-password/";
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSent(true);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border shadow-xl p-8"
        style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-[20px] shadow-lg">🔐</div>
          <div>
            <div className="text-[16px] font-semibold">Reset Password</div>
            <div className="bangla text-fluid-caption" style={{ color: "var(--text-muted)" }}>পাসওয়ার্ড রিসেট করুন</div>
          </div>
        </div>

        {sent ? (
          <div className="mt-6">
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-[13px] text-emerald-700">
              ✅ Reset link sent! আপনার email চেক করুন।
            </div>
            <p className="mt-4 text-fluid-caption" style={{ color: "var(--text-muted)" }}>
              Email না পেলে <strong>Spam folder</strong> চেক করুন।
            </p>
            <Link href="/login" className="mt-5 block text-center text-[13px] font-medium text-emerald-700">
              ← Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="text-fluid-caption font-medium" style={{ color: "var(--text-muted)" }}>Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.edu.bd"
                className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-emerald-500/30"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
              <p className="mt-2 text-fluid-micro flex items-start gap-1.5" style={{ color: "var(--text-faint)" }}>
                <span>💡</span>
                <span>Email আসবে <strong>SKB Education</strong>-এর পক্ষ থেকে, subject: "Reset your password"</span>
              </p>
            </div>
            {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-[13px] text-rose-700">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 py-3 text-[14px] font-semibold text-white shadow-lg shadow-emerald-500/20 disabled:opacity-60">
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            <div className="text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
              <Link href="/login" className="font-medium text-emerald-700">← Back to login</Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
