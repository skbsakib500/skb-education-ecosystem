"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PromotionTab({ institutionId, isAdmin }: { institutionId: string; isAdmin: boolean }) {
  const [classes, setClasses] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [year, setYear] = useState("");
  const [studentsCount, setStudentsCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    const [cRes, yRes, lRes] = await Promise.all([
      supabase.from("classes").select("*").eq("institution_id", institutionId).order("name"),
      supabase.from("academic_years").select("*").eq("institution_id", institutionId).order("start_date", { ascending: false }),
      supabase.from("promotion_logs").select("*, from_class:from_class_id(name), to_class:to_class_id(name)")
        .eq("institution_id", institutionId).order("performed_at", { ascending: false }).limit(20),
    ]);
    setClasses(cRes.data ?? []);
    setYears(yRes.data ?? []);
    setLogs(lRes.data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [institutionId]);

  useEffect(() => {
    if (!from) { setStudentsCount(0); return; }
    (async () => {
      const { count } = await supabase.from("students")
        .select("id", { count: "exact", head: true })
        .eq("institution_id", institutionId).eq("class_id", from);
      setStudentsCount(count ?? 0);
    })();
  }, [from, institutionId]);

  const promote = async () => {
    if (!from || !to) return;
    setSaving(true); setMsg("");
    const { data, error } = await supabase.rpc("promote_students", {
      p_institution_id: institutionId,
      p_from_class_id: from,
      p_to_class_id: to,
      p_academic_year_id: year || null,
    });
    setSaving(false);
    if (error) { setMsg("❌ " + error.message); return; }
    setMsg("✅ " + data.promoted + " students promoted!");
    setFrom(""); setTo(""); setYear(""); setConfirming(false);
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
      <h2 className="text-[16px] font-semibold mb-4">Class Promotion · <span className="bangla font-normal">শ্রেণি উন্নীতকরণ</span></h2>

      <div className="rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 mb-4 text-[12px] text-amber-800">
          ⚠️ <strong>সতর্কতা:</strong> এই operation সব student-দের class পরিবর্তন করবে। বছরের শেষে ব্যবহার করুন। Undo করা যাবে না।
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>From Class *</label>
            <select value={from} onChange={(e) => setFrom(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <option value="">— Select —</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}{c.section ? " · " + c.section : ""}</option>)}
            </select>
            {from && (
              <div className="mt-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
                👥 {studentsCount} students
              </div>
            )}
          </div>
          <div>
            <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>To Class *</label>
            <select value={to} onChange={(e) => setTo(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <option value="">— Select —</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}{c.section ? " · " + c.section : ""}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Academic Year</label>
            <select value={year} onChange={(e) => setYear(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <option value="">— None —</option>
              {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
          </div>
        </div>

        {!confirming ? (
          <button onClick={() => from && to && from !== to ? setConfirming(true) : setMsg("❌ From/To select করুন")}
            disabled={!from || !to || from === to}
            className="mt-5 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 px-6 py-2.5 text-[13px] font-semibold text-white shadow disabled:opacity-50">
            🔄 Preview Promotion
          </button>
        ) : (
          <div className="mt-5 rounded-xl border-2 border-amber-500/50 p-4 bg-amber-500/5">
            <div className="text-[14px] font-semibold">আপনি কি নিশ্চিত?</div>
            <div className="text-[13px] mt-2" style={{ color: "var(--text-muted)" }}>
              <strong>{studentsCount}</strong> students-কে <strong>{classes.find((c) => c.id === from)?.name}</strong> থেকে <strong>{classes.find((c) => c.id === to)?.name}</strong>-এ promote করা হবে।
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={promote} disabled={saving}
                className="rounded-full bg-rose-500 px-6 py-2.5 text-[13px] font-semibold text-white shadow disabled:opacity-50">
                {saving ? "Promoting..." : "✓ Yes, Promote"}
              </button>
              <button onClick={() => setConfirming(false)}
                className="rounded-full border px-6 py-2.5 text-[13px]" style={{ borderColor: "var(--border)" }}>Cancel</button>
            </div>
          </div>
        )}

        {msg && <div className="mt-4 text-[13px] font-medium">{msg}</div>}
      </div>

      {logs.length > 0 && (
        <div className="mt-6">
          <div className="text-[12px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
            Promotion History
          </div>
          <div className="space-y-2">
            {logs.map((l) => (
              <div key={l.id} className="rounded-xl border p-3 text-[12px]"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <div className="flex justify-between">
                  <span className="font-medium">{l.from_class?.name || "?"} → {l.to_class?.name || "?"}</span>
                  <span style={{ color: "var(--text-muted)" }}>{l.students_count} students</span>
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: "var(--text-faint)" }}>
                  {new Date(l.performed_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
