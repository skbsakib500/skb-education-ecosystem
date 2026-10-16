"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AssignmentsTab({ institutionId, isAdmin }: { institutionId: string; isAdmin: boolean }) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const [form, setForm] = useState({
    class_id: "", subject_id: "", title: "", description: "",
    max_marks: 100, due_at: new Date(Date.now() + 7*864e5).toISOString().slice(0,16),
    allow_late: false,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    const [aRes, cRes, sRes] = await Promise.all([
      supabase.rpc("teacher_assignments", { p_institution_id: institutionId }),
      supabase.from("classes").select("*").eq("institution_id", institutionId).order("name"),
      supabase.from("subjects").select("*").eq("institution_id", institutionId).order("name"),
    ]);
    setAssignments(aRes.data ?? []);
    setClasses(cRes.data ?? []);
    setSubjects(sRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [institutionId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.class_id || !form.title.trim()) { setErr("Class + Title দিন"); return; }
    setSaving(true); setErr("");
    const { data, error } = await supabase.rpc("create_assignment", {
      p_institution_id: institutionId,
      p_class_id: form.class_id,
      p_subject_id: form.subject_id || null,
      p_title: form.title.trim(),
      p_description: form.description.trim() || null,
      p_max_marks: form.max_marks,
      p_due_at: new Date(form.due_at).toISOString(),
      p_allow_late: form.allow_late,
    });
    setSaving(false);
    if (error) { setErr(error.message); return; }
    setForm({ class_id: "", subject_id: "", title: "", description: "", max_marks: 100, due_at: new Date(Date.now() + 7*864e5).toISOString().slice(0,16), allow_late: false });
    setShowForm(false);
    alert("✅ Assignment created · " + (data as any).notified + " students notified");
    await load();
  };

  if (selected) return <AssignmentDetail assignment={selected} onBack={() => { setSelected(null); load(); }} institutionId={institutionId} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-[16px] font-semibold">Assignments · <span className="bangla font-normal">অ্যাসাইনমেন্ট</span></h2>
        <button onClick={() => setShowForm(!showForm)}
          className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow">
          {showForm ? "Cancel" : "+ New Assignment"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="mb-4 rounded-2xl border p-4 space-y-3"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select required value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })}
              className="rounded-xl border px-3.5 py-2 text-[13px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <option value="">— Class * —</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}{c.section ? " · " + c.section : ""}</option>)}
            </select>
            <select value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
              className="rounded-xl border px-3.5 py-2 text-[13px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <option value="">— Subject (optional) —</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Assignment title *"
            className="w-full rounded-xl border px-3.5 py-2 text-[13px] outline-none"
            style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3} placeholder="Description / instructions..."
            className="w-full rounded-xl border px-3.5 py-2 text-[13px] outline-none resize-none"
            style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>Max Marks</label>
              <input type="number" min="1" value={form.max_marks} onChange={(e) => setForm({ ...form, max_marks: parseInt(e.target.value) || 100 })}
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[13px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>Due Date *</label>
              <input type="datetime-local" required value={form.due_at} onChange={(e) => setForm({ ...form, due_at: e.target.value })}
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[13px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-[12px]">
            <input type="checkbox" checked={form.allow_late} onChange={(e) => setForm({ ...form, allow_late: e.target.checked })} className="accent-emerald-500" />
            Allow late submissions
          </label>
          {err && <div className="text-[12px] text-rose-600">{err}</div>}
          <button type="submit" disabled={saving}
            className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-2 text-[13px] font-semibold text-white disabled:opacity-50">
            {saving ? "Creating..." : "Create & Notify Students"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-10 text-[13px]" style={{ color: "var(--text-muted)" }}>Loading...</div>
      ) : assignments.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="text-[36px]">📝</div>
          <div className="mt-2 text-[14px] font-semibold">No assignments yet</div>
        </div>
      ) : (
        <div className="space-y-2">
          {assignments.map((a) => {
            const isOverdue = new Date(a.due_at) < new Date();
            return (
              <button key={a.id} onClick={() => setSelected(a)}
                className="w-full rounded-2xl border p-4 text-left hover:-translate-y-0.5 hover:shadow-md transition"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold">{a.title}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {a.class_name}{a.section ? " · " + a.section : ""} {a.subject_name && " · " + a.subject_name}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2 text-[11px]" style={{ color: "var(--text-muted)" }}>
                      <span>🎯 {a.max_marks} marks</span>
                      <span style={{ color: isOverdue ? "#f43f5e" : "inherit" }}>📅 Due {new Date(a.due_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="rounded-full bg-emerald-500/15 px-2 py-1 font-semibold text-emerald-700">
                      {a.graded_count}/{a.submissions_count} graded
                    </span>
                    {a.pending_count > 0 && (
                      <span className="rounded-full bg-amber-500/15 px-2 py-1 font-semibold text-amber-700">
                        {a.pending_count} pending
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AssignmentDetail({ assignment, onBack, institutionId }: any) {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState<any>(null);
  const [marks, setMarks] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("assignment_submissions")
      .select("*, students:student_id(full_name, student_id, roll_number)")
      .eq("assignment_id", assignment.id)
      .order("submitted_at", { ascending: false });
    setSubs(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [assignment.id]);

  const submitGrade = async () => {
    if (!grading) return;
    const m = parseInt(marks);
    if (isNaN(m) || m < 0 || m > assignment.max_marks) { alert("Invalid marks"); return; }
    setSaving(true);
    const { error } = await supabase.rpc("grade_submission", {
      p_submission_id: grading.id, p_marks: m, p_feedback: feedback || null,
    });
    setSaving(false);
    if (error) { alert(error.message); return; }
    setGrading(null); setMarks(""); setFeedback("");
    await load();
  };

  return (
    <div>
      <button onClick={onBack} className="text-[13px] mb-3" style={{ color: "var(--text-muted)" }}>← Back</button>
      <div className="rounded-2xl border p-5 mb-4" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
        <div className="text-[18px] font-semibold">{assignment.title}</div>
        <div className="text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>
          {assignment.class_name}{assignment.section ? " · " + assignment.section : ""} {assignment.subject_name && " · " + assignment.subject_name}
        </div>
        <div className="flex flex-wrap gap-3 mt-3 text-[12px]" style={{ color: "var(--text-muted)" }}>
          <span>🎯 {assignment.max_marks} marks</span>
          <span>📅 Due {new Date(assignment.due_at).toLocaleString()}</span>
          <span>📥 {subs.length} submissions</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-[13px]" style={{ color: "var(--text-muted)" }}>Loading...</div>
      ) : subs.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="text-[36px]">📭</div>
          <div className="mt-2 text-[14px] font-semibold">No submissions yet</div>
        </div>
      ) : (
        <div className="space-y-2">
          {subs.map((s) => (
            <div key={s.id} className="rounded-2xl border p-4"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-[14px] font-semibold">{s.students?.full_name}</div>
                    {s.is_late && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Late</span>}
                    {s.status === "graded" && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">{s.marks_obtained}/{assignment.max_marks}</span>}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {s.students?.student_id} · {new Date(s.submitted_at).toLocaleString()}
                  </div>
                  {s.content && <div className="mt-2 text-[12px] rounded-lg p-2" style={{ background: "var(--bg-soft)" }}>{s.content}</div>}
                  {s.feedback && (
                    <div className="mt-2 text-[11px] italic" style={{ color: "var(--text-muted)" }}>
                      💬 {s.feedback}
                    </div>
                  )}
                </div>
                {grading?.id === s.id ? (
                  <div className="w-full sm:w-auto flex gap-2 items-start">
                    <input type="number" placeholder="Marks" value={marks} onChange={(e) => setMarks(e.target.value)}
                      className="w-20 rounded-lg border px-2 py-1.5 text-[13px] outline-none"
                      style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
                    <input type="text" placeholder="Feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)}
                      className="flex-1 rounded-lg border px-2 py-1.5 text-[12px] outline-none"
                      style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
                    <button onClick={submitGrade} disabled={saving}
                      className="rounded-full bg-emerald-500/15 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 disabled:opacity-50">
                      Save
                    </button>
                    <button onClick={() => setGrading(null)} className="text-[11px] text-rose-600">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => { setGrading(s); setMarks(String(s.marks_obtained ?? "")); setFeedback(s.feedback ?? ""); }}
                    className="rounded-full border px-3 py-1.5 text-[11px] font-medium"
                    style={{ borderColor: "var(--border)" }}>
                    {s.status === "graded" ? "✏️ Edit Grade" : "🎯 Grade"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
