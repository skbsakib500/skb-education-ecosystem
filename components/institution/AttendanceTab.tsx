"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const STATUSES = [
  { value: "present", label: "Present", emoji: "✅" },
  { value: "absent",  label: "Absent",  emoji: "❌" },
  { value: "late",    label: "Late",    emoji: "⏰" },
  { value: "excused", label: "Excused", emoji: "📝" },
];

export default function AttendanceTab({ institutionId, isAdmin }: { institutionId: string; isAdmin: boolean }) {
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [selectedClass, setSelectedClass] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<"mark" | "summary">("mark");
  const [summary, setSummary] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("classes").select("*").eq("institution_id", institutionId).order("name");
      setClasses(data ?? []);
      if (data && data.length > 0) setSelectedClass(data[0].id);
      setLoading(false);
    })();
  }, [institutionId]);

  useEffect(() => {
    if (!selectedClass) return;
    (async () => {
      const [sRes, aRes] = await Promise.all([
        supabase.from("students").select("*").eq("institution_id", institutionId).eq("class_id", selectedClass).order("roll_number"),
        supabase.from("attendance").select("student_id, status").eq("class_id", selectedClass).eq("date", date),
      ]);
      setStudents(sRes.data ?? []);
      const map: Record<string, string> = {};
      (aRes.data ?? []).forEach((a: any) => { map[a.student_id] = a.status; });
      setAttendance(map);
    })();
  }, [selectedClass, date, institutionId]);

  useEffect(() => { if (view === "summary") loadSummary(); }, [view]);

  const loadSummary = async () => {
    const { data } = await supabase.rpc("attendance_summary", { p_institution_id: institutionId, p_days: 30 });
    setSummary(data ?? []);
  };

  const save = async () => {
    if (students.length === 0) return;
    setSaving(true);
    const rows = students.map((s) => ({
      institution_id: institutionId, class_id: selectedClass,
      student_id: s.id, date, status: attendance[s.id] || "present",
    }));
    const { error } = await supabase.from("attendance").upsert(rows, { onConflict: "class_id,student_id,date" });
    setSaving(false);
    if (error) { alert(error.message); return; }
    alert("✅ Attendance saved!");
  };

  const markAll = (status: string) => {
    const next: Record<string, string> = {};
    students.forEach((s) => { next[s.id] = status; });
    setAttendance(next);
  };

  if (loading) return <div className="text-center py-10 text-[13px]" style={{ color: "var(--text-muted)" }}>Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[16px] font-semibold">Attendance · <span className="bangla font-normal">উপস্থিতি</span></h2>
        <div className="flex gap-1 rounded-full border p-1 text-[12px]" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <button onClick={() => setView("mark")} className={"rounded-full px-3 py-1 font-medium " + (view === "mark" ? "bg-[var(--text)] text-[var(--bg)]" : "")}
            style={view !== "mark" ? { color: "var(--text-muted)" } : {}}>Mark</button>
          <button onClick={() => setView("summary")} className={"rounded-full px-3 py-1 font-medium " + (view === "summary" ? "bg-[var(--text)] text-[var(--bg)]" : "")}
            style={view !== "summary" ? { color: "var(--text-muted)" } : {}}>Summary</button>
        </div>
      </div>

      {view === "summary" ? (
        summary.length === 0 ? (
          <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            <div className="text-[36px]">📊</div>
            <div className="mt-2 text-[14px] font-semibold">No attendance data</div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ background: "var(--bg-soft)" }}>
                  <th className="text-left p-3 text-[11px] font-medium uppercase" style={{ color: "var(--text-muted)" }}>Student</th>
                  <th className="text-center p-3 text-[11px] font-medium uppercase" style={{ color: "var(--text-muted)" }}>✅</th>
                  <th className="text-center p-3 text-[11px] font-medium uppercase" style={{ color: "var(--text-muted)" }}>❌</th>
                  <th className="text-center p-3 text-[11px] font-medium uppercase" style={{ color: "var(--text-muted)" }}>⏰</th>
                  <th className="text-right p-3 text-[11px] font-medium uppercase" style={{ color: "var(--text-muted)" }}>%</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((s) => (
                  <tr key={s.student_id} className="border-t" style={{ borderColor: "var(--border)" }}>
                    <td className="p-3 font-medium">{s.full_name}</td>
                    <td className="p-3 text-center text-emerald-700">{s.present_count}</td>
                    <td className="p-3 text-center text-rose-700">{s.absent_count}</td>
                    <td className="p-3 text-center text-amber-700">{s.late_count}</td>
                    <td className="p-3 text-right">
                      <span className={"rounded-full px-2 py-0.5 text-[11px] font-semibold " +
                        (Number(s.percentage) >= 80 ? "bg-emerald-500/15 text-emerald-700" :
                         Number(s.percentage) >= 60 ? "bg-amber-500/15 text-amber-700" :
                         "bg-rose-500/15 text-rose-700")}>{s.percentage}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : classes.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="text-[36px]">📚</div>
          <div className="mt-2 text-[14px] font-semibold">No classes yet</div>
          <div className="bangla text-[12px]" style={{ color: "var(--text-muted)" }}>Classes tab থেকে class যোগ করুন</div>
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Class</label>
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}{c.section ? " · " + c.section : ""}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>
          </div>

          {students.length === 0 ? (
            <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <div className="text-[36px]">👥</div>
              <div className="mt-2 text-[14px] font-semibold">No students</div>
              <div className="bangla text-[12px]" style={{ color: "var(--text-muted)" }}>Students tab থেকে যোগ করুন</div>
            </div>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap gap-2">
                <button onClick={() => markAll("present")} className="rounded-full bg-emerald-500/15 px-3 py-1.5 text-[11px] font-semibold text-emerald-700">✅ Mark All Present</button>
                <button onClick={() => markAll("absent")} className="rounded-full bg-rose-500/15 px-3 py-1.5 text-[11px] font-semibold text-rose-700">❌ Mark All Absent</button>
              </div>
              <div className="space-y-2">
                {students.map((s) => {
                  const status = attendance[s.id] || "present";
                  return (
                    <div key={s.id} className="rounded-2xl border p-3 flex items-center justify-between gap-3"
                      style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-medium truncate">{s.full_name}</div>
                        {s.roll_number && <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>Roll {s.roll_number}</div>}
                      </div>
                      <div className="flex gap-1">
                        {STATUSES.map((st) => (
                          <button key={st.value} onClick={() => setAttendance({ ...attendance, [s.id]: st.value })}
                            className={"rounded-full px-2.5 py-1 text-[11px] font-medium transition " + (status === st.value ? "font-bold" : "")}
                            style={status === st.value ? { background: "rgba(16,185,129,0.2)" } : { background: "var(--bg-soft)", color: "var(--text-muted)" }}>
                            {st.emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button onClick={save} disabled={saving}
                className="mt-4 w-full rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 py-2.5 text-[13px] font-semibold text-white shadow disabled:opacity-50">
                {saving ? "Saving..." : "💾 Save Attendance"}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
