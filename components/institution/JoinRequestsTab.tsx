"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function JoinRequestsTab({ institutionId, isAdmin }: { institutionId: string; isAdmin: boolean }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending"|"approved"|"rejected">("pending");
  const [acting, setActing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("join_requests")
      .select("*, profiles:user_id(full_name, email, avatar_url)")
      .eq("institution_id", institutionId)
      .eq("status", filter)
      .order("created_at", { ascending: false });
    setRequests(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [institutionId, filter]);

  const approve = async (id: string) => {
    if (!confirm("Approve this request?")) return;
    setActing(id);
    const { error } = await supabase.rpc("approve_join_request", { p_request_id: id, p_notes: null });
    setActing(null);
    if (error) { alert(error.message); return; }
    await load();
  };

  const reject = async (id: string) => {
    const reason = prompt("Reject reason:");
    if (!reason) return;
    setActing(id);
    const { error } = await supabase.rpc("reject_join_request", { p_request_id: id, p_reason: reason });
    setActing(null);
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

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-[16px] font-semibold">
          Join Requests · <span className="bangla font-normal">যুক্ত হওয়ার অনুরোধ</span>
        </h2>
        <div className="flex gap-1 rounded-full border p-1 text-[12px]" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          {(["pending","approved","rejected"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={"rounded-full px-3 py-1 font-medium capitalize " + (filter === f ? "bg-[var(--text)] text-[var(--bg)]" : "")}
              style={filter !== f ? { color: "var(--text-muted)" } : {}}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-[13px]" style={{ color: "var(--text-muted)" }}>Loading...</div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="text-[36px]">📥</div>
          <div className="mt-2 text-[14px] font-semibold">No {filter} requests</div>
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map((r) => {
            const p = r.profiles;
            const meta = r.metadata || {};
            const roleMetaMap: Record<string, { emoji: string; color: string }> = {
              teacher: { emoji: "👨‍🏫", color: "#8b5cf6" },
              student: { emoji: "🎓", color: "#06b6d4" },
              parent: { emoji: "👪", color: "#14b8a6" },
              accountant: { emoji: "💰", color: "#f59e0b" },
              librarian: { emoji: "📚", color: "#f59e0b" },
              receptionist: { emoji: "☎️", color: "#f59e0b" },
            };
            const roleMeta = roleMetaMap[r.requested_role] || { emoji: "👤", color: "#64748b" };

            return (
              <div key={r.id} className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full text-[20px] shrink-0"
                    style={{ background: roleMeta.color + "20" }}>
                    {p?.avatar_url ? <img src={p.avatar_url} className="h-full w-full object-cover rounded-full" alt="" /> : roleMeta.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-semibold">{p?.full_name || p?.email}</span>
                      <span className="rounded-full bg-[var(--bg-soft)] px-2 py-0.5 text-[10px] font-semibold capitalize">
                        {r.requested_role}
                      </span>
                    </div>
                    {p?.email && <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>✉️ {p.email}</div>}
                    {meta.subjects?.length > 0 && (
                      <div className="mt-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
                        📚 Subjects: {meta.subjects.join(", ")}
                      </div>
                    )}
                    {meta.experience && <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>💼 Experience: {meta.experience} years</div>}
                    {meta.class_name && <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>🎓 Class: {meta.class_name} {meta.roll_number && `· Roll ${meta.roll_number}`}</div>}
                    {meta.child_name && <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>👶 Child: {meta.child_name} {meta.relationship && `(${meta.relationship})`}</div>}
                    <div className="text-[10px] mt-1" style={{ color: "var(--text-faint)" }}>
                      {new Date(r.created_at).toLocaleString()}
                    </div>
                  </div>

                  {r.status === "pending" && (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => approve(r.id)} disabled={acting === r.id}
                        className="rounded-full bg-emerald-500/15 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 disabled:opacity-50">
                        ✓ Approve
                      </button>
                      <button onClick={() => reject(r.id)} disabled={acting === r.id}
                        className="rounded-full bg-rose-500/15 px-3 py-1.5 text-[11px] font-semibold text-rose-700 disabled:opacity-50">
                        ✕
                      </button>
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
