"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

const TOGGLES = [
  { k: "attendance_alerts",   e: "✅", l: "Attendance Alerts",   bn: "উপস্থিতি" },
  { k: "exam_results",        e: "📊", l: "Exam Results",        bn: "পরীক্ষার ফলাফল" },
  { k: "fee_reminders",       e: "💰", l: "Fee Reminders",       bn: "ফি রিমাইন্ডার" },
  { k: "assignment_alerts",   e: "📓", l: "Assignment Alerts",   bn: "অ্যাসাইনমেন্ট" },
  { k: "notice_alerts",       e: "📢", l: "Notice Alerts",       bn: "নোটিশ" },
  { k: "message_alerts",      e: "💬", l: "Message Alerts",      bn: "মেসেজ" },
  { k: "result_alerts",       e: "🎯", l: "Result Published",    bn: "ফলাফল প্রকাশ" },
  { k: "email_enabled",       e: "📧", l: "Email Notifications", bn: "ইমেইল" },
];

export default function NotificationPrefsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [prefs, setPrefs] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login/"); return; }
    if (!user) return;
    (async () => {
      const { data } = await supabase.rpc("get_my_notification_prefs");
      setPrefs(data);
      setLoading(false);
    })();
  }, [user, authLoading, router]);

  const toggle = (k: string) => setPrefs({ ...prefs, [k]: !prefs[k] });

  const save = async () => {
    setSaving(true); setMsg("");
    const { error } = await supabase.rpc("update_my_notification_prefs", {
      p_attendance_alerts: !!prefs.attendance_alerts,
      p_exam_results: !!prefs.exam_results,
      p_fee_reminders: !!prefs.fee_reminders,
      p_assignment_alerts: !!prefs.assignment_alerts,
      p_notice_alerts: !!prefs.notice_alerts,
      p_message_alerts: !!prefs.message_alerts,
      p_result_alerts: !!prefs.result_alerts,
      p_email_enabled: !!prefs.email_enabled,
      p_quiet_hours_start: prefs.quiet_hours_start || null,
      p_quiet_hours_end: prefs.quiet_hours_end || null,
    });
    setSaving(false);
    if (error) { setMsg("❌ " + error.message); return; }
    setMsg("✅ Preferences saved!");
    setTimeout(() => setMsg(""), 2500);
  };

  if (authLoading || loading || !prefs) return <div className="min-h-screen flex items-center justify-center"><div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>;

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/hub" className="text-[13px]" style={{ color: "var(--text-muted)" }}>← Hub</Link>

        <div className="mt-4 rounded-3xl border p-6 md:p-8" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-[20px] shadow-lg">🔔</div>
            <div>
              <h1 className="text-[18px] font-semibold">Notification Preferences</h1>
              <div className="bangla text-[12px]" style={{ color: "var(--text-muted)" }}>কোন নোটিফিকেশন পেতে চান</div>
            </div>
          </div>

          <div className="space-y-2">
            {TOGGLES.map((t) => (
              <div key={t.k} className="flex items-center justify-between gap-3 rounded-xl border p-3"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <div className="flex items-center gap-3">
                  <div className="text-[20px]">{t.e}</div>
                  <div>
                    <div className="text-[13px] font-semibold">{t.l}</div>
                    <div className="bangla text-[11px]" style={{ color: "var(--text-muted)" }}>{t.bn}</div>
                  </div>
                </div>
                <button onClick={() => toggle(t.k)}
                  className={"relative h-6 w-11 rounded-full transition " + (prefs[t.k] ? "bg-emerald-500" : "bg-[var(--border-strong)]")}>
                  <span className={"absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all " + (prefs[t.k] ? "left-[22px]" : "left-0.5")} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border p-4 space-y-3" style={{ borderColor: "var(--border)" }}>
            <div className="text-[13px] font-semibold">🌙 Quiet Hours (Optional)</div>
            <div className="bangla text-[11px]" style={{ color: "var(--text-muted)" }}>এই সময়ে কোনো নোটিফিকেশন আসবে না</div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <label className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>Start</label>
                <input type="time" value={prefs.quiet_hours_start || ""} onChange={(e) => setPrefs({ ...prefs, quiet_hours_start: e.target.value })}
                  className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[13px] outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
              </div>
              <div>
                <label className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>End</label>
                <input type="time" value={prefs.quiet_hours_end || ""} onChange={(e) => setPrefs({ ...prefs, quiet_hours_end: e.target.value })}
                  className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[13px] outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
              </div>
            </div>
          </div>

          {msg && <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-[13px] text-emerald-700">{msg}</div>}

          <button onClick={save} disabled={saving}
            className="mt-6 w-full rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 py-3 text-[14px] font-semibold text-white shadow disabled:opacity-50">
            {saving ? "Saving..." : "💾 Save Preferences"}
          </button>
        </div>
      </div>
    </main>
  );
}
