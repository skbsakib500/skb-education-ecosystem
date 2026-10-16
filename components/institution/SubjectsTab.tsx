"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SubjectsTab({ institutionId, isAdmin }: { institutionId: string; isAdmin: boolean }) {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ name: "", code: "", class_id: "", teacher_id: "" });

  const load = async () => {
    setLoading(true);
    const [sRes, cRes, tRes] = await Promise.all([
      supabase.from("subjects").select("*, classes:class_id(name), profiles:teacher_id(full_name, email)").eq("institution_id", institutionId).order("name"),
      supabase.from("classes").select("*").eq("institution_id", institutionId).order("name"),
      supabase.from("memberships").select("user_id, profiles:user_id(full_name, email)").eq("institution_id", institutionId).eq("role", "teacher"),
    ]);
    setSubjects(sRes.data ?? []);
    setClasses(cRes.data ?? []);
    setTeachers(tRes.data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [institutionId]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true); setErr("");
    const { error } = await supabase.from("subjects").insert({
      institution_id: institutionId, name: form.name.trim(),
      code: form.code.trim() || null, class_id: form.class_id || null,
      teacher_id: form.teacher_id || null,
    });
    if (error) { setErr(error.message); setSaving(false); return; }
    setForm({ name: "", code: "", class_id: "", teacher_id: "" });
    setShowForm(false); setSaving(false); await load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete subject?")) return;
    await supabase.from("subjects").delete().eq("id", id); await load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[16px] font-semibold">Subjects · <span className="bangla font-normal">বিষয়</span></h2>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)}
            className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow">
            {showForm ? "Cancel" : "+ Add Subject"}
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <form onSubmit={add} className="mb-4 rounded-2xl border p-4 space-y-3"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Subject Name *</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Physics"
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Code</label>
              <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="PHY-101"
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none font-mono"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Class</label>
              <select value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <option value="">All classes</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Teacher</label>
              <select value={form.teacher_id} onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <option value="">Unassigned</option>
                {teachers.map((t) => <option key={t.user_id} value={t.user_id}>{t.profiles?.full_name || t.profiles?.email}</option>)}
              </select>
            </div>
          </div>
          {err && <div className="text-[12px] text-rose-600">{err}</div>}
          <button type="submit" disabled={saving}
            className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-2 text-[13px] font-semibold text-white disabled:opacity-50">
            {saving ? "..." : "Save Subject"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-10 text-[13px]" style={{ color: "var(--text-muted)" }}>Loading...</div>
      ) : subjects.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="text-[36px]">📖</div>
          <div className="mt-2 text-[14px] font-semibold">No subjects yet</div>
          <div className="bangla text-[12px]" style={{ color: "var(--text-muted)" }}>+ Add Subject দিয়ে শুরু করুন</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {subjects.map((s) => (
            <div key={s.id} className="rounded-2xl border p-4 group"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold truncate">{s.name}</div>
                  {s.code && <div className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>{s.code}</div>}
                </div>
                {isAdmin && (
                  <button onClick={() => remove(s.id)}
                    className="opacity-0 group-hover:opacity-100 rounded-full px-1.5 text-[11px] text-rose-600">✕</button>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                {s.classes?.name && <span className="rounded-full bg-[var(--bg-soft)] px-2 py-0.5">🎓 {s.classes.name}</span>}
                {s.profiles?.full_name && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-700">👨‍🏫 {s.profiles.full_name}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
