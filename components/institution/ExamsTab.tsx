"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ExamsTab({ institutionId, isAdmin }: { institutionId: string; isAdmin: boolean }) {
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeExam, setActiveExam] = useState<any>(null);
  const [form, setForm] = useState({ title: "", subject: "", class_id: "", type: "mcq", duration_minutes: 60, total_marks: 100 });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    const [eRes, cRes] = await Promise.all([
      supabase.from("exams").select("*, classes:class_id(name)").eq("institution_id", institutionId).order("created_at", { ascending: false }),
      supabase.from("classes").select("*").eq("institution_id", institutionId).order("name"),
    ]);
    setExams(eRes.data ?? []); setClasses(cRes.data ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, [institutionId]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setErr("");
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("exams").insert({
      institution_id: institutionId, title: form.title.trim(),
      subject: form.subject.trim() || null, class_id: form.class_id || null,
      type: form.type, duration_minutes: form.duration_minutes,
      total_marks: form.total_marks, created_by: u?.user?.id,
    });
    if (error) { setErr(error.message); setSaving(false); return; }
    setForm({ title: "", subject: "", class_id: "", type: "mcq", duration_minutes: 60, total_marks: 100 });
    setShowForm(false); setSaving(false); await load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete exam and questions?")) return;
    await supabase.from("exams").delete().eq("id", id); await load();
  };

  const publish = async (id: string, status: string) => {
    await supabase.from("exams").update({ status }).eq("id", id); await load();
  };

  if (activeExam) return <QuestionBuilder exam={activeExam} onBack={() => { setActiveExam(null); load(); }} isAdmin={isAdmin} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[16px] font-semibold">Exams · <span className="bangla font-normal">পরীক্ষা</span></h2>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)}
            className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow">
            {showForm ? "Cancel" : "+ New Exam"}
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <form onSubmit={create} className="mb-4 rounded-2xl border p-4 space-y-3"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Title *</label>
              <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Mid-term Physics"
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Subject</label>
              <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Physics"
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Class</label>
              <select value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <option value="">— Select —</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <option value="mcq">MCQ (Auto-grade)</option>
                <option value="written">Written</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Duration (min)</label>
              <input type="number" value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 60 })}
                min="5" max="480"
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Total Marks</label>
              <input type="number" value={form.total_marks}
                onChange={(e) => setForm({ ...form, total_marks: parseInt(e.target.value) || 100 })}
                min="1"
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>
          </div>
          {err && <div className="text-[12px] text-rose-600">{err}</div>}
          <button type="submit" disabled={saving}
            className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-2 text-[13px] font-semibold text-white disabled:opacity-50">
            {saving ? "Creating..." : "Create Exam"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-[13px] text-center py-10" style={{ color: "var(--text-muted)" }}>Loading...</div>
      ) : exams.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="text-[36px]">📝</div>
          <div className="mt-3 text-[15px] font-semibold">No exams yet</div>
          <div className="bangla mt-1 text-[12px]" style={{ color: "var(--text-muted)" }}>এখনো কোনো পরীক্ষা নেই</div>
        </div>
      ) : (
        <div className="space-y-3">
          {exams.map((ex) => (
            <div key={ex.id} className="rounded-2xl border p-4"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[15px] font-semibold">{ex.title}</span>
                    <span className={"rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                      (ex.status === "published" ? "bg-emerald-500/15 text-emerald-700" :
                       ex.status === "ongoing" ? "bg-amber-500/15 text-amber-700" :
                       "bg-slate-500/10 text-slate-600")}>{ex.status.toUpperCase()}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {ex.subject && <span>📖 {ex.subject}</span>}
                    {ex.classes?.name && <span>🎓 {ex.classes.name}</span>}
                    <span>⏱️ {ex.duration_minutes}min</span>
                    <span>🎯 {ex.total_marks} marks</span>
                  </div>
                </div>
              </div>
              {isAdmin && (
                <div className="mt-3 flex flex-wrap gap-2 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                  <button onClick={() => setActiveExam(ex)}
                    className="rounded-full bg-[var(--bg-soft)] px-3 py-1.5 text-[11px] font-medium">✏️ Manage Questions</button>
                  {ex.status === "draft" && (
                    <button onClick={() => publish(ex.id, "published")}
                      className="rounded-full bg-emerald-500/15 px-3 py-1.5 text-[11px] font-medium text-emerald-700">✓ Publish</button>
                  )}
                  <button onClick={() => remove(ex.id)}
                    className="rounded-full px-3 py-1.5 text-[11px] font-medium text-rose-600 hover:bg-rose-500/10">Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionBuilder({ exam, onBack, isAdmin }: { exam: any; onBack: () => void; isAdmin: boolean }) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    question_text: "",
    options: [{ key: "A", text: "" }, { key: "B", text: "" }, { key: "C", text: "" }, { key: "D", text: "" }],
    correct_answer: "A", marks: 1,
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("questions").select("*").eq("exam_id", exam.id).order("order_index");
    setQuestions(data ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, [exam.id]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.question_text.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("questions").insert({
      exam_id: exam.id, question_text: form.question_text.trim(), type: "mcq",
      options: form.options, correct_answer: form.correct_answer, marks: form.marks, order_index: questions.length,
    });
    setSaving(false);
    if (error) { alert(error.message); return; }
    setForm({ question_text: "", options: [{ key: "A", text: "" }, { key: "B", text: "" }, { key: "C", text: "" }, { key: "D", text: "" }], correct_answer: "A", marks: 1 });
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete question?")) return;
    await supabase.from("questions").delete().eq("id", id); await load();
  };

  const updOpt = (idx: number, text: string) => setForm({ ...form, options: form.options.map((o, i) => i === idx ? { ...o, text } : o) });
  const totalMarks = questions.reduce((s, q) => s + (q.marks || 0), 0);

  return (
    <div>
      <button onClick={onBack} className="text-[13px] mb-3" style={{ color: "var(--text-muted)" }}>← Back</button>
      <div className="mb-4">
        <h2 className="text-[18px] font-semibold">{exam.title}</h2>
        <div className="text-[12px]" style={{ color: "var(--text-muted)" }}>{questions.length} questions · {totalMarks} marks</div>
      </div>
      {isAdmin && (
        <form onSubmit={add} className="mb-6 rounded-2xl border p-4 space-y-3"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div>
            <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Question *</label>
            <textarea required value={form.question_text} onChange={(e) => setForm({ ...form, question_text: e.target.value })}
              rows={2} placeholder="What is the SI unit of force?"
              className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none resize-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
          </div>
          <div className="space-y-2">
            {form.options.map((opt, i) => (
              <div key={opt.key} className="flex items-center gap-2">
                <input type="radio" checked={form.correct_answer === opt.key}
                  onChange={() => setForm({ ...form, correct_answer: opt.key })}
                  className="h-4 w-4 accent-emerald-500" />
                <span className="w-4 font-semibold text-[13px]">{opt.key}.</span>
                <input type="text" value={opt.text} onChange={(e) => updOpt(i, e.target.value)}
                  placeholder={`Option ${opt.key}`}
                  className="flex-1 rounded-lg border px-3 py-1.5 text-[13px] outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
              </div>
            ))}
          </div>
          <div className="flex gap-3 items-end">
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Marks</label>
              <input type="number" value={form.marks} onChange={(e) => setForm({ ...form, marks: parseInt(e.target.value) || 1 })}
                min="1" className="mt-1 w-24 rounded-xl border px-3 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>
            <button type="submit" disabled={saving}
              className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-2 text-[13px] font-semibold text-white disabled:opacity-50">
              {saving ? "..." : "+ Add Question"}
            </button>
          </div>
        </form>
      )}
      {loading ? (
        <div className="text-center py-6 text-[13px]" style={{ color: "var(--text-muted)" }}>Loading...</div>
      ) : questions.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="text-[36px]">❓</div>
          <div className="mt-2 text-[14px] font-semibold">No questions yet</div>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={q.id} className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="rounded-full bg-[var(--bg-soft)] px-2 py-0.5 text-[10px] font-semibold">Q{i + 1}</span>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">{q.marks} marks</span>
                  </div>
                  <div className="text-[14px] font-medium">{q.question_text}</div>
                  {q.options && (
                    <div className="mt-2 space-y-1">
                      {q.options.map((opt: any) => (
                        <div key={opt.key} className={"text-[12px] flex gap-2 " + (opt.key === q.correct_answer ? "text-emerald-700 dark:text-emerald-300 font-semibold" : "")}
                          style={opt.key !== q.correct_answer ? { color: "var(--text-muted)" } : {}}>
                          <span>{opt.key}.</span><span>{opt.text || "—"}</span>
                          {opt.key === q.correct_answer && <span>✓</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {isAdmin && (
                  <button onClick={() => remove(q.id)} className="shrink-0 rounded-full px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-500/10">Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
