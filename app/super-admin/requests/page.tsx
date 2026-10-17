"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export default function AdminRequestsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending"|"approved"|"rejected"|"all">("pending");
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login/");
  }, [user, authLoading, router]);

  const load = async () => {
    setLoading(true);
    let q = supabase.from("institution_requests").select("*, requester:requested_by(email, raw_user_meta_data)").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setRequests(data ?? []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user, filter]);

  const approve = async (id: string) => {
    if (!confirm("এই institution request approve করবেন?")) return;
    setActionId(id);
    const { data, error } = await supabase.rpc("approve_institution_request", { p_request_id: id, p_notes: null });
    setActionId(null);
    if (error) { alert(error.message); return; }
    alert("✅ Approved! Institution created and admin assigned.");
    await load();
  };

  const reject = async (id: string) => {
    const reason = prompt("Reject reason:");
    if (!reason) return;
    setActionId(id);
    const { error } = await supabase.rpc("reject_institution_request", { p_request_id: id, p_reason: reason });
    setActionId(null);
    if (error) { alert(error.message); return; }
    await load();
  };

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 border-b" style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
          <Link href="/super-admin" className="text-[13px]" style={{ color: "var(--text-muted)" }}>← Super Admin</Link>
          <div className="text-[13px] font-semibold">Institution Requests</div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 md:px-8 pt-8">
        <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 p-6 text-white">
          <h1 className="text-[22px] font-semibold">📥 Institution Requests</h1>
          <p className="text-[13px] mt-1 text-violet-50/90">নতুন প্রতিষ্ঠানের অনুরোধ যাচাই ও অনুমোদন</p>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto">
          {(["pending","approved","rejected","all"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={"rounded-full border px-4 py-1.5 text-fluid-caption font-medium capitalize whitespace-nowrap " + (filter === f ? "bg-[var(--text)] text-[var(--bg)]" : "")}
              style={filter !== f ? { borderColor: "var(--border)" } : {}}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-[13px]" style={{ color: "var(--text-muted)" }}>Loading...</div>
        ) : requests.length === 0 ? (
          <div className="mt-6 rounded-2xl border p-12 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            <div className="text-[48px]">✅</div>
            <div className="mt-2 text-[14px] font-semibold">No {filter} requests</div>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-[16px] font-semibold">{r.name}</div>
                      <span className={"rounded-full px-2 py-0.5 text-fluid-micro font-semibold capitalize " +
                        (r.status === "pending" ? "bg-amber-500/15 text-amber-700" :
                         r.status === "approved" ? "bg-emerald-500/15 text-emerald-700" :
                         "bg-rose-500/15 text-rose-700")}>{r.status}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2 text-fluid-micro" style={{ color: "var(--text-muted)" }}>
                      <span>🏷️ {r.type}</span>
                      {r.division && <span>📍 {r.city || r.district}, {r.division}</span>}
                      {r.contact_email && <span>✉️ {r.contact_email}</span>}
                      {r.contact_phone && <span>📞 {r.contact_phone}</span>}
                      <span>👤 {r.requester?.email}</span>
                    </div>
                    {r.description && <div className="mt-2 text-fluid-caption italic" style={{ color: "var(--text-muted)" }}>"{r.description}"</div>}
                    <div className="mt-2 text-fluid-micro" style={{ color: "var(--text-faint)" }}>
                      Requested {new Date(r.created_at).toLocaleString()}
                    </div>
                  </div>

                  {r.status === "pending" && (
                    <div className="flex flex-col gap-2 shrink-0">
                      <button onClick={() => approve(r.id)} disabled={actionId === r.id}
                        className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-2 text-fluid-caption font-semibold text-white shadow disabled:opacity-50">
                        {actionId === r.id ? "..." : "✓ Approve"}
                      </button>
                      <button onClick={() => reject(r.id)} disabled={actionId === r.id}
                        className="rounded-full border border-rose-500/30 px-4 py-2 text-fluid-caption font-semibold text-rose-600 disabled:opacity-50">
                        ✕ Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
