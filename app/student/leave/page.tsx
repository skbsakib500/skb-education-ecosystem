"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

const TYPES = [
  { v: "sick", l: "Sick Leave", e: "🤒" },
  { v: "casual", l: "Casual", e: "🌴" },
  { v: "emergency", l: "Emergency", e: "🚨" },
  { v: "family", l: "Family", e: "👨‍👩‍👧" },
  { v: "vacation", l: "Vacation", e: "🏖️" },
  { v: "other", l: "Other", e: "📌" },
];

export default function StudentLeavePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [instId, setInstId] = useState("");
  const [form, setForm] = useState({
    leave_type: "sick", start_date: new Date().toISOString().slice(0,10),
    end_date: new Date().toISOString().slice(0,10), reason: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    if (!user) return;
    const { data: s } = await supabase.from("students")
      .select("id, institution_id").eq("linked_user_id", user.id).limit(1).maybeSingle();
    if (s) { setStudentId(s.id); setInstId(s.institution_id); }

    const { data } = await supabase.from("leave_requests").select("*")
      .eq("requester_id", user.id).order("created_at", { ascending: false });
    setRequests(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login/"); return; }
    if (user) load();
  }, [user, authLoading, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instId || !form.reason.trim()) return;
    setSaving(true); setErr("");
    const { error } = await supabase.from("leave_requests").insert({
      institution_id: instId,
      requester_id: user!.id,
      requester_role: "student",
      student_id: studentId || null,
      leave_type: form.leave_type,
      start_date: form.start_date,
      end_date: form.end_date,
      reason: form.reason.trim(),
    });
    setSaving(false);
    if (error) { setErr(error.message); return; }
    setForm({ leave_type: "sick", start_date: new Date().toISOString().slice(0,10), end_date: new Date().toISOString().slice(0,10), reason: "" });
    setShowForm(false);
    await load();
  };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>;

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 border-b"
        style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link href="/student" className="text-[13px]" style={{ color: "var(--text-muted)" }}>← Student</Link>
          <button onClick={() => setShowForm(!showForm)}
            className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow">
            {showForm ? "Cancel" : "+ Apply"}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-6">
        {showForm && (
          <form onSubmit={submit} className="mb-4 rounded-2xl border p-5 space-y-3"
            style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TYPES.map((t) => (
                <button key={t.v} type="button" onClick={() => setForm({ ...form, leave_type: t.v })}
                  className={"rounded-xl border p-2.5 text-center " + (form.leave_type === t.v ? "bg-emerald-500/15 border-emerald-500/40" : "")}
                  style={form.leave_type !== t.v ? { borderColor: "var(--border)" } : {}}>
                  <div className="text-[18px]">{t.e}</div>
                  <div className="text-[11px] font-medium mt-0.5">{t.l}</div>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>From</label>
                <input type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[13px] outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
              </div>
              <div>
                <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>To</label>
                <input type="date" required value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[13px] outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
              </div>
            </div>
            <textarea required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
              rows={3} placeholder="Reason *"
              className="w-full rounded-xl border px-3.5 py-2.5 text-[13px] outline-none resize-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            {err && <div className="text-[12px] text-rose-600">{err}</div>}
            <button type="submit" disabled={saving || !instId}
              className="w-full rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 py-2.5 text-[13px] font-semibold text-white shadow disabled:opacity-50">
              {saving ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        )}

        {requests.length === 0 ? (
          <div className="rounded-2xl border p-12 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            <div className="text-[48px]">✋</div>
            <div className="mt-3 text-[15px] font-semibold">No leave requests yet</div>
          </div>
        ) : (
          <div className="space-y-2">
            {requests.map((l) => {
              const t = TYPES.find((x) => x.v === l.leave_type) ?? TYPES[0];
              const statusMeta: any = {
                pending: { l: "Pending", c: "bg-amber-500/15 text-amber-700" },
                approved: { l: "Approved", c: "bg-emerald-500/15 text-emerald-700" },
                rejected: { l: "Rejected", c: "bg-rose-500/15 text-rose-700" },
              };
              const sm = statusMeta[l.status] ?? statusMeta.pending;
              return (
                <div key={l.id} className="rounded-2xl border p-4"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl text-[18px]">{t.e}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-semibold">{t.l}</span>
                        <span className={"rounded-full px-2 py-0.5 text-[10px] font-semibold " + sm.c}>{sm.l}</span>
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {new Date(l.start_date).toLocaleDateString()} → {new Date(l.end_date).toLocaleDateString()}
                      </div>
                      <div className="mt-1 text-[12px]">{l.reason}</div>
                      {l.review_note && <div className="text-[11px] italic mt-1" style={{ color: "var(--text-muted)" }}>Note: {l.review_note}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
