"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { exportToCSV } from "@/lib/exportData";

export default function AuditTab({ institutionId, isAdmin }: { institutionId: string; isAdmin: boolean }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const load = async () => {
    setLoading(true);
    let q = supabase.from("audit_logs")
      .select("*, profiles:actor_user_id(full_name, email)")
      .eq("institution_id", institutionId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (filter) q = q.eq("entity_type", filter);
    const { data } = await q;
    setLogs(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [institutionId, filter]);

  const doExport = () => {
    const headers = ["Date", "Actor", "Action", "Entity", "Entity ID"];
    const rows = logs.map((l) => [
      new Date(l.created_at).toLocaleString(),
      l.profiles?.full_name || l.profiles?.email || "System",
      l.action,
      l.entity_type || "",
      l.entity_id || "",
    ]);
    exportToCSV("audit-logs", headers, rows);
  };

  if (!isAdmin) return (
    <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
      <div className="text-[36px]">🔒</div>
      <div className="mt-2 text-[14px] font-semibold">Admin access required</div>
    </div>
  );

  const entityTypes = ["", "fee_payment", "student", "teacher", "assignment", "attendance"];

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-[16px] font-semibold">Audit Log · <span className="bangla font-normal">কার্যক্রম লগ</span></h2>
        <div className="flex gap-2">
          <button onClick={doExport} disabled={logs.length === 0}
            className="rounded-full border px-3 py-1.5 text-fluid-caption font-medium disabled:opacity-50"
            style={{ borderColor: "var(--border)" }}>📥 Export CSV</button>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            className="rounded-full border px-3 py-1.5 text-fluid-caption outline-none"
            style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            {entityTypes.map((t) => <option key={t} value={t}>{t || "All entities"}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-[13px]" style={{ color: "var(--text-muted)" }}>Loading...</div>
      ) : logs.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="text-[36px]">📋</div>
          <div className="mt-2 text-[14px] font-semibold">No audit logs</div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <table className="w-full text-fluid-caption">
            <thead>
              <tr style={{ background: "var(--bg-soft)" }}>
                <th className="text-left p-2.5 font-semibold text-fluid-micro uppercase" style={{ color: "var(--text-muted)" }}>When</th>
                <th className="text-left p-2.5 font-semibold text-fluid-micro uppercase" style={{ color: "var(--text-muted)" }}>Actor</th>
                <th className="text-left p-2.5 font-semibold text-fluid-micro uppercase" style={{ color: "var(--text-muted)" }}>Action</th>
                <th className="text-left p-2.5 font-semibold text-fluid-micro uppercase hidden sm:table-cell" style={{ color: "var(--text-muted)" }}>Entity</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="p-2.5 whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                    {new Date(l.created_at).toLocaleString()}
                  </td>
                  <td className="p-2.5 font-medium truncate max-w-[150px]">{l.profiles?.full_name || l.profiles?.email || "System"}</td>
                  <td className="p-2.5">
                    <span className={"rounded-full px-2 py-0.5 text-fluid-micro font-semibold " +
                      (l.action === "insert" ? "bg-emerald-500/15 text-emerald-700" :
                       l.action === "update" ? "bg-amber-500/15 text-amber-700" :
                       l.action === "delete" ? "bg-rose-500/15 text-rose-700" :
                       "bg-slate-500/10 text-fg-muted")}>{l.action}</span>
                  </td>
                  <td className="p-2.5 hidden sm:table-cell" style={{ color: "var(--text-muted)" }}>{l.entity_type || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
