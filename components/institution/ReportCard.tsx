"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const GRADE_BANDS = [
  { min: 80, grade: "A+", color: "#10b981" },
  { min: 70, grade: "A",  color: "#10b981" },
  { min: 60, grade: "A-", color: "#14b8a6" },
  { min: 50, grade: "B",  color: "#06b6d4" },
  { min: 40, grade: "C",  color: "#f59e0b" },
  { min: 33, grade: "D",  color: "#f97316" },
  { min: 0,  grade: "F",  color: "#f43f5e" },
];

function gradeFor(pct: number) {
  return GRADE_BANDS.find((b) => pct >= b.min) ?? GRADE_BANDS[GRADE_BANDS.length - 1];
}

export default function ReportCard({
  institutionId, studentId, onClose,
}: { institutionId: string; studentId: string; onClose: () => void }) {
  const [student, setStudent] = useState<any>(null);
  const [institution, setInstitution] = useState<any>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [sRes, iRes, eRes, aRes] = await Promise.all([
        supabase.from("students").select("*, classes:class_id(name, section)").eq("id", studentId).single(),
        supabase.from("institutions").select("name, logo_url, emoji, motto, address, contact_phone").eq("id", institutionId).single(),
        supabase.from("exam_attempts").select("*, exams:exam_id(title, subject, total_marks)")
          .eq("student_id", studentId).eq("status", "graded")
          .order("submitted_at", { ascending: false }),
        supabase.from("attendance").select("status").eq("student_id", studentId),
      ]);
      setStudent(sRes.data);
      setInstitution(iRes.data);
      setExams(eRes.data ?? []);
      setAttendance(aRes.data ?? []);
      setLoading(false);
    })();
  }, [studentId, institutionId]);

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur">
      <div className="bg-white rounded-2xl p-8">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    </div>
  );

  const presentCount = attendance.filter((a) => a.status === "present" || a.status === "late").length;
  const attendancePct = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;

  // Group exams by subject
  const bySubject: Record<string, any[]> = {};
  exams.forEach((e) => {
    const subj = e.exams?.subject || "General";
    if (!bySubject[subj]) bySubject[subj] = [];
    bySubject[subj].push(e);
  });

  const subjectRows = Object.entries(bySubject).map(([subject, list]) => {
    const totalScore = list.reduce((s, e) => s + Number(e.score), 0);
    const totalMax = list.reduce((s, e) => s + Number(e.total_marks), 0);
    const pct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
    return { subject, totalScore, totalMax, pct, grade: gradeFor(pct), count: list.length };
  });

  const overallScore = exams.reduce((s, e) => s + Number(e.score), 0);
  const overallMax = exams.reduce((s, e) => s + Number(e.total_marks), 0);
  const overallPct = overallMax > 0 ? Math.round((overallScore / overallMax) * 100) : 0;
  const overallGrade = gradeFor(overallPct);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur p-4 overflow-y-auto">
      <div className="w-full max-w-3xl my-8">
        <div className="flex justify-end mb-3 gap-2">
          <button onClick={() => window.print()}
            className="rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-emerald-700 shadow">
            🖨️ Print / Save PDF
          </button>
          <button onClick={onClose}
            className="rounded-full bg-white/20 backdrop-blur px-4 py-2 text-[13px] font-medium text-white">
            ✕ Close
          </button>
        </div>

        <div id="report-card" className="rounded-2xl bg-white p-8 shadow-2xl text-black">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 pb-5 border-b-2 border-emerald-600">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-[32px] overflow-hidden">
                {institution?.logo_url
                  ? <img src={institution.logo_url} alt="" className="h-full w-full object-cover" />
                  : (institution?.emoji || "🏫")}
              </div>
              <div>
                <div className="text-[20px] font-bold text-gray-900">{institution?.name || "Institution"}</div>
                {institution?.motto && <div className="text-[12px] italic text-gray-600">"{institution.motto}"</div>}
                {institution?.contact_phone && <div className="text-[11px] text-gray-500 mt-0.5">📞 {institution.contact_phone}</div>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-emerald-700 tracking-widest">Report Card</div>
              <div className="text-[11px] text-gray-500 mt-0.5">{new Date().toLocaleDateString()}</div>
            </div>
          </div>

          {/* Student Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-5">
            <InfoBlock label="Student Name" value={student?.full_name || "—"} />
            <InfoBlock label="Student ID" value={student?.student_id || "—"} mono />
            <InfoBlock label="Class" value={(student?.classes?.name || "—") + (student?.classes?.section ? " · " + student.classes.section : "")} />
            <InfoBlock label="Roll Number" value={student?.roll_number || "—"} />
          </div>

          {/* Summary */}
          <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-4 mb-5">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-[10px] uppercase font-bold text-emerald-700">Overall</div>
                <div className="text-[28px] font-bold" style={{ color: overallGrade.color }}>{overallPct}%</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-emerald-700">Grade</div>
                <div className="text-[28px] font-bold" style={{ color: overallGrade.color }}>{overallGrade.grade}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-emerald-700">Attendance</div>
                <div className="text-[28px] font-bold" style={{ color: attendancePct >= 80 ? "#10b981" : attendancePct >= 60 ? "#f59e0b" : "#f43f5e" }}>
                  {attendancePct}%
                </div>
              </div>
            </div>
          </div>

          {/* Subject table */}
          {subjectRows.length > 0 && (
            <div className="mb-5">
              <div className="text-[12px] font-bold uppercase tracking-wider text-emerald-700 mb-2">Subject Performance</div>
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr className="bg-emerald-50 border-b border-emerald-200">
                    <th className="text-left p-2 font-bold">Subject</th>
                    <th className="text-center p-2 font-bold">Exams</th>
                    <th className="text-center p-2 font-bold">Score</th>
                    <th className="text-center p-2 font-bold">%</th>
                    <th className="text-center p-2 font-bold">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectRows.map((r, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="p-2 font-medium">{r.subject}</td>
                      <td className="p-2 text-center text-gray-600">{r.count}</td>
                      <td className="p-2 text-center">{r.totalScore}/{r.totalMax}</td>
                      <td className="p-2 text-center font-semibold" style={{ color: r.grade.color }}>{r.pct}%</td>
                      <td className="p-2 text-center">
                        <span className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                          style={{ background: r.grade.color + "20", color: r.grade.color }}>
                          {r.grade.grade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Exam history */}
          {exams.length > 0 && (
            <div className="mb-5">
              <div className="text-[12px] font-bold uppercase tracking-wider text-emerald-700 mb-2">Recent Exams</div>
              <div className="space-y-1">
                {exams.slice(0, 8).map((e) => {
                  const pct = Number(e.total_marks) > 0 ? Math.round((Number(e.score) / Number(e.total_marks)) * 100) : 0;
                  const g = gradeFor(pct);
                  return (
                    <div key={e.id} className="flex items-center justify-between py-1 border-b border-gray-100 text-[12px]">
                      <div>
                        <span className="font-medium">{e.exams?.title}</span>
                        <span className="text-[10px] text-gray-500 ml-2">{e.exams?.subject}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-600">{e.score}/{e.total_marks}</span>
                        <span className="font-bold" style={{ color: g.color }}>{pct}% ({g.grade})</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Grading scale */}
          <div className="border-t pt-4 mt-4">
            <div className="text-[10px] uppercase font-bold text-gray-500 mb-2">Grading Scale</div>
            <div className="flex flex-wrap gap-2 text-[10px]">
              {GRADE_BANDS.map((g) => (
                <span key={g.grade} className="rounded-full px-2 py-0.5 font-semibold"
                  style={{ background: g.color + "15", color: g.color }}>
                  {g.grade}: ≥{g.min}%
                </span>
              ))}
            </div>
          </div>

          {/* Signature */}
          <div className="mt-8 pt-4 grid grid-cols-2 gap-8">
            <div className="border-t border-gray-400 pt-1 text-center text-[10px] text-gray-500">
              Class Teacher Signature
            </div>
            <div className="border-t border-gray-400 pt-1 text-center text-[10px] text-gray-500">
              Principal Signature
            </div>
          </div>

          <div className="mt-4 text-center text-[9px] text-gray-400">
            Generated by SKB Education Ecosystem · {new Date().toLocaleString()}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #report-card, #report-card * { visibility: visible; }
          #report-card { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}

function InfoBlock({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase font-bold text-gray-500">{label}</div>
      <div className={"text-[13px] font-semibold text-gray-900 mt-0.5 " + (mono ? "font-mono" : "")}>{value}</div>
    </div>
  );
}
