"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const TYPES = [
  { v: "sick", l: "Sick Leave", bn: "অসুস্থতা", e: "🤒" },
  { v: "casual", l: "Casual", bn: "সাধারণ", e: "🌴" },
  { v: "emergency", l: "Emergency", bn: "জরুরি", e: "🚨" },
  { v: "family", l: "Family", bn: "পারিবারিক", e: "👨‍👩‍👧" },
  { v: "vacation", l: "Vacation", bn: "ছুটি", e: "🏖️" },
  { v: "other", l: "Other", bn: "অন্যান্য", e: "📌" },
];

export default function LeaveTab({ institutionId, isAdmin }: { institutionId: string; isAdmin: boolean }) {
  const [filter, setFilter] = useState<"pending"|"approved"|"rejected"|"all">("pending");
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    let q = supabase.from("leave_requests")
      .select("*, profiles:requester_id(full_name, email, avatar_url, primary_role), students:student_id(full_name, student_id)")
      .eq("institution_id", institutionId)
      .order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setLeaves(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [institutionId, filter]);

  const review = async (id: string, approve: boolean) => {
    let note: string | null = null;
    if (!approve) {
      note = prompt("Rejection reason:");
      if (!note) return;
    }
    const { error } = await supabase.rpc("review_leave", { p_leave_id: id, p_approve: approve, p_note: note });
    if (error) { alert(error.message); return; }
    await load();
  };

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
        <div className="text-[36px]">🔒</div>
        <div className="mt-2 text-[14px] font-semibold">Admin access required</div>
      </div>
    );
  }

  const statusMeta = (s: string) => ({
    pending:  { l: "Pending",  c: "bg-amber-500/15 text-amber-700" },
    approved: { l: "Approved", c: "bg-emerald-500/15 text-emerald-700" },
    rejected: { l: "Rejected", c: "bg-rose-500/15 text-rose-700" },
    cancelled:{ l: "Cancelled",c: "bg-slate-500/10 text-slate-600" },
  } as any)[s] ?? { l: s, c: "" };

  const daysBetween = (a: string, b: string) => Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 864e5) + 1);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-[16px] font-semibold">Leave Requests · <span className="bangla font-normal">ছুটির অনুরোধ</span></h2>
        <div className="flex gap-1 rounded-full border p-1 text-[12px]"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          {(["pending","approved","rejected","all"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={"rounded-full px-3 py-1 font-medium capitalize " + (filter === f ? "bg-[var(--text)] text-[var(--bg)]" : "")}
              style={filter !== f ? { color: "var(--text-muted)" } : {}}>{f}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-[13px]" style={{ color: "var(--text-muted)" }}>Loading...</div>
      ) : leaves.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="text-[36px]">✋</div>
          <div className="mt-2 text-[14px] font-semibold">No {filter} leaves</div>
        </div>
      ) : (
        <div className="space-y-2">
          {leaves.map((l) => {
            const t = TYPES.find((x) => x.v === l.leave_type) ?? TYPES[0];
            const sm = statusMeta(l.status);
            const days = daysBetween(l.start_date, l.end_date);
            return (
              <div key={l.id} className="rounded-2xl border p-4"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl text-[22px] shrink-0"
                    style={{ background: "linear-gradient(135deg,#10b98120,#14b8a620)" }}>{t.e}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-semibold">
                        {l.students?.full_name || l.profiles?.full_name || "User"}
                      </span>
                      <span className="rounded-full bg-[var(--bg-soft)] px-2 py-0.5 text-[10px] font-medium capitalize">
                        {l.requester_role}
                      </span>
                      <span className={"rounded-full px-2 py-0.5 text-[10px] font-semibold " + sm.c}>{sm.l}</span>
                    </div>
                    <div className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
                      {t.l} · {new Date(l.start_date).toLocaleDateString()} → {new Date(l.end_date).toLocaleDateString()} ({days} day{days > 1 ? "s" : ""})
                    </div>
                    <div className="mt-2 text-[12px]">{l.reason}</div>
                    {l.review_note && <div className="mt-1 text-[11px] italic" style={{ color: "var(--text-muted)" }}>Note: {l.review_note}</div>}
                  </div>
                  {l.status === "pending" && (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => review(l.id, true)}
                        className="rounded-full bg-emerald-500/15 px-3 py-1.5 text-[11px] font-semibold text-emerald-700">✓ Approve</button>
                      <button onClick={() => review(l.id, false)}
                        className="rounded-full bg-rose-500/15 px-3 py-1.5 text-[11px] font-semibold text-rose-700">✕ Reject</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
