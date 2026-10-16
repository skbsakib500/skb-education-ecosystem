"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const CLASS_ROLES = [
  { value: "student",           label: "Student",        bn: "ছাত্র",           emoji: "👤" },
  { value: "captain",           label: "Class Captain",  bn: "ক্লাস ক্যাপ্টেন",  emoji: "⭐" },
  { value: "assistant_captain", label: "Asst. Captain",  bn: "সহকারী ক্যাপ্টেন", emoji: "🥈" },
  { value: "prefect",           label: "Prefect",        bn: "প্রিফেক্ট",        emoji: "🎖️" },
  { value: "monitor",           label: "Monitor",        bn: "মনিটর",           emoji: "📋" },
];

export default function StudentsTabV2({
  institutionId, isAdmin, onChange,
}: { institutionId: string; isAdmin: boolean; onChange: () => void }) {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ full_name: "", roll_number: "", class_id: "", class_role: "student", email: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [previewId, setPreviewId] = useState("");
  const [filter, setFilter] = useState("");

  const load = async () => {
    setLoading(true);
    const [sRes, cRes] = await Promise.all([
      supabase.from("students").select("*").eq("institution_id", institutionId).order("created_at", { ascending: false }),
      supabase.from("classes").select("*").eq("institution_id", institutionId).order("name"),
    ]);
    setStudents(sRes.data ?? []); setClasses(cRes.data ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, [institutionId]);

  useEffect(() => {
    if (!showForm) return;
    (async () => {
      const { data, error } = await supabase.rpc("generate_student_id", { p_institution_id: institutionId });
      if (!error && data) setPreviewId(data as string);
    })();
  }, [showForm, institutionId]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) return;
    setSaving(true); setErr("");
    const { error } = await supabase.from("students").insert({
      institution_id: institutionId,
      full_name: form.full_name.trim(),
      roll_number: form.roll_number.trim() || null,
      class_id: form.class_id || null,
      class_role: form.class_role,
      email: form.email.trim().toLowerCase() || null,
    });
    if (error) { setErr(error.message); setSaving(false); return; }
    setForm({ full_name: "", roll_number: "", class_id: "", class_role: "student", email: "" });
    setShowForm(false); setSaving(false);
    await load(); onChange();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this student?")) return;
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (!error) { await load(); onChange(); }
  };

  const updateRole = async (id: string, role: string) => {
    await supabase.from("students").update({ class_role: role }).eq("id", id);
    await load();
  };

  const inviteStudent = async (s: any) => {
    if (!s.email) { alert("Student email missing — add email first"); return; }
    const { error } = await supabase.from("invitations").insert({
      institution_id: institutionId, email: s.email, role: "student",
    });
    if (error) { alert(error.message); return; }
    alert("✅ Invitation created! Check Teachers tab → Pending Invitations to copy link.");
  };

  const className = (id: string) => classes.find((c) => c.id === id)?.name ?? "—";
  const filtered = filter ? students.filter((s) => s.class_id === filter) : students;
  const roleMeta = (r: string) => CLASS_ROLES.find((x) => x.value === r) ?? CLASS_ROLES[0];

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-[16px] font-semibold">
          Students · <span className="bangla font-normal">শিক্ষার্থী</span>
          <span className="ml-2 text-[12px] font-normal" style={{ color: "var(--text-muted)" }}>({filtered.length})</span>
        </h2>
        <div className="flex gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            className="rounded-full border px-3 py-1.5 text-[12px] outline-none"
            style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            <option value="">All classes</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {isAdmin && (
            <button onClick={() => setShowForm(!showForm)}
              className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow">
              {showForm ? "Cancel" : "+ Add Student"}
            </button>
          )}
        </div>
      </div>

      {showForm && isAdmin && (
        <form onSubmit={add} className="mb-4 rounded-2xl border p-4 space-y-3"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: "var(--bg-soft)" }}>
            <div>
              <div className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>Auto Student ID</div>
              <div className="font-mono text-[15px] font-semibold text-emerald-700 dark:text-emerald-300">{previewId || "..."}</div>
            </div>
            <div className="text-[10px]" style={{ color: "var(--text-faint)" }}>Institution prefix + sequence</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Full Name *</label>
              <input type="text" required value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Sakib Al Hasan"
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Roll No</label>
              <input type="text" value={form.roll_number}
                onChange={(e) => setForm({ ...form, roll_number: e.target.value })}
                placeholder="01"
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Email (for invite)</label>
              <input type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="student@email.com"
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Class Role</label>
              <select value={form.class_role} onChange={(e) => setForm({ ...form, class_role: e.target.value })}
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                {CLASS_ROLES.map((r) => <option key={r.value} value={r.value}>{r.emoji} {r.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Class</label>
            <select value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })}
              className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <option value="">— Select class —</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}{c.section ? " · " + c.section : ""}</option>)}
            </select>
          </div>
          {err && <div className="text-[12px] text-rose-600">{err}</div>}
          <button type="submit" disabled={saving}
            className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-2 text-[13px] font-semibold text-white disabled:opacity-50">
            {saving ? "Saving..." : "Save Student"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-[13px] text-center py-10" style={{ color: "var(--text-muted)" }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="text-[36px]">👥</div>
          <div className="mt-3 text-[15px] font-semibold">No students {filter ? "in this class" : "yet"}</div>
          <div className="bangla text-[12px]" style={{ color: "var(--text-muted)" }}>
            {isAdmin ? "+ Add Student দিয়ে শুরু করুন" : "Admin এখনো student যোগ করেননি"}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => {
            const role = roleMeta(s.class_role);
            const isLeader = s.class_role !== "student";
            return (
              <div key={s.id} className="rounded-2xl border p-3 flex items-center gap-3"
                style={{
                  borderColor: isLeader ? "rgba(16,185,129,0.3)" : "var(--border)",
                  background: isLeader ? "rgba(16,185,129,0.03)" : "var(--surface-3)",
                }}>
                <div className={"flex h-11 w-11 items-center justify-center rounded-full text-[14px] font-bold " +
                  (isLeader ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white" : "bg-[var(--bg-soft)]")}>
                  {s.full_name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[14px] font-semibold truncate">{s.full_name}</span>
                    {isLeader && (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        {role.emoji} {role.label}
                      </span>
                    )}
                    {s.linked_user_id && (
                      <span className="rounded-full bg-teal-500/15 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                        ✓ Linked
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-0.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {s.student_id && <span className="font-mono">🆔 {s.student_id}</span>}
                    {s.roll_number && <span>Roll {s.roll_number}</span>}
                    {s.class_id && <span>📚 {className(s.class_id)}</span>}
                    {s.email && <span>✉️ {s.email}</span>}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1">
                    {s.email && !s.linked_user_id && (
                      <button onClick={() => inviteStudent(s)}
                        className="rounded-full bg-emerald-500/15 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                        Invite
                      </button>
                    )}
                    <select value={s.class_role} onChange={(e) => updateRole(s.id, e.target.value)}
                      className="rounded-lg border px-2 py-1 text-[11px] outline-none"
                      style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                      {CLASS_ROLES.map((r) => <option key={r.value} value={r.value}>{r.emoji} {r.label}</option>)}
                    </select>
                    <button onClick={() => remove(s.id)}
                      className="rounded-full px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-500/10">
                      ✕
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
