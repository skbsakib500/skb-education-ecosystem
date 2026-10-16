"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validSession, setValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    // Supabase puts access_token in URL hash after clicking reset link
    supabase.auth.getSession().then(({ data }) => {
      setValidSession(!!data.session);
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError("Password কমপক্ষে ৬ অক্ষর"); return; }
    if (password !== confirm) { setError("Password মিলছে না"); return; }

    setLoading(true); setError("");
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    alert("✅ Password updated! Login করুন।");
    router.push("/login/");
  };

  if (validSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!validSession) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border p-8 text-center"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="text-[48px]">⚠️</div>
          <div className="mt-3 text-[16px] font-semibold">Invalid or Expired Link</div>
          <div className="bangla text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>
            আবার reset link চেয়ে নিন
          </div>
          <Link href="/forgot-password" className="mt-5 inline-block rounded-full bg-emerald-500 px-5 py-2 text-[13px] font-semibold text-white">
            Request New Link
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border shadow-xl p-8"
        style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-[20px] shadow-lg">🔑</div>
          <div>
            <div className="text-[16px] font-semibold">Set New Password</div>
            <div className="bangla text-[12px]" style={{ color: "var(--text-muted)" }}>নতুন পাসওয়ার্ড দিন</div>
          </div>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>New Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-emerald-500/30"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
          </div>
          <div>
            <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Confirm Password</label>
            <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-emerald-500/30"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
          </div>
          {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-[13px] text-rose-700">{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 py-3 text-[14px] font-semibold text-white shadow-lg shadow-emerald-500/20 disabled:opacity-60">
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </main>
  );
}
