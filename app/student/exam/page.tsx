"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export default function Page() {
  return <Suspense fallback={<Loading />}><ExamAttempt /></Suspense>;
}

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
    </div>
  );
}

function ExamAttempt() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams.get("id");

  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [attempt, setAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // Load exam + questions + create attempt
  useEffect(() => {
    if (!user || !examId) return;
    (async () => {
      const [eRes, qRes, sRes] = await Promise.all([
        supabase.from("exams").select("*").eq("id", examId).maybeSingle(),
        supabase.from("questions").select("*").eq("exam_id", examId).order("order_index"),
        supabase.from("students").select("id, institution_id").eq("linked_user_id", user.id),
      ]);

      if (!eRes.data) { setError("Exam not found"); setLoading(false); return; }

      const student = (sRes.data ?? []).find((s: any) => s.institution_id === eRes.data.institution_id);
      if (!student) { setError("You are not enrolled in this institution"); setLoading(false); return; }

      // Check existing attempt
      const { data: existing } = await supabase.from("exam_attempts")
        .select("*").eq("exam_id", examId).eq("student_id", student.id).maybeSingle();

      if (existing) {
        if (existing.status === "graded" || existing.status === "submitted") {
          setResult({ score: existing.score, total: existing.total_marks });
          setAttempt(existing);
          setExam(eRes.data);
          setQuestions(qRes.data ?? []);
          setLoading(false);
          return;
        }
        setAttempt(existing);
        setAnswers(existing.answers ?? {});
      } else {
        const { data: created } = await supabase.from("exam_attempts").insert({
          exam_id: examId, student_id: student.id,
          institution_id: eRes.data.institution_id,
          total_marks: eRes.data.total_marks,
        }).select().single();
        setAttempt(created);
      }

      setExam(eRes.data);
      setQuestions(qRes.data ?? []);
      setTimeLeft((eRes.data.duration_minutes || 60) * 60);
      setLoading(false);
    })();
  }, [user, examId]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0 || result) return;
    const t = setInterval(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [timeLeft, result]);

  // Auto-submit on time out
  useEffect(() => {
    if (timeLeft === 0 && !result && attempt && !submitting && questions.length > 0) {
      submit();
    }
  }, [timeLeft]);

  const submit = async () => {
    if (!attempt) return;
    setSubmitting(true);
    await supabase.from("exam_attempts").update({
      answers, status: "submitted", submitted_at: new Date().toISOString(),
    }).eq("id", attempt.id);

    const { data, error } = await supabase.rpc("grade_exam_attempt", { p_attempt_id: attempt.id });
    setSubmitting(false);
    if (error) { setError(error.message); return; }
    setResult(data);
  };

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-[48px]">❌</div>
          <div className="mt-3 text-[16px] font-semibold">Cannot start exam</div>
          <div className="mt-2 text-[13px] text-rose-600">{error}</div>
          <button onClick={() => router.push("/student/")}
            className="mt-5 rounded-full border px-5 py-2 text-[13px]" style={{ borderColor: "var(--border)" }}>
            Back to Student Home
          </button>
        </div>
      </div>
    );
  }

  // Result screen
  if (result) {
    const pct = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md w-full rounded-3xl border p-8 shadow-xl"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="text-[56px]">🎉</div>
          <div className="mt-2 text-[16px] font-semibold">{exam.title}</div>
          <div className="bangla text-fluid-caption" style={{ color: "var(--text-muted)" }}>পরীক্ষা সম্পন্ন হয়েছে</div>

          <div className="mt-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-5">
            <div className="text-[13px] opacity-90">Your Score</div>
            <div className="text-[36px] font-bold">{result.score}/{result.total}</div>
            <div className="text-[13px] opacity-90 mt-1">{pct}%</div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 text-fluid-caption">
            <div className="rounded-xl p-2" style={{ background: "var(--bg-soft)" }}>
              <div className="text-fluid-micro" style={{ color: "var(--text-muted)" }}>Grade</div>
              <div className="font-bold">{pct >= 80 ? "A+" : pct >= 70 ? "A" : pct >= 60 ? "A-" : pct >= 50 ? "B" : pct >= 40 ? "C" : "F"}</div>
            </div>
            <div className="rounded-xl p-2" style={{ background: "var(--bg-soft)" }}>
              <div className="text-fluid-micro" style={{ color: "var(--text-muted)" }}>Correct</div>
              <div className="font-bold">{questions.filter((q) => answers[q.id] === q.correct_answer).length}/{questions.length}</div>
            </div>
            <div className="rounded-xl p-2" style={{ background: "var(--bg-soft)" }}>
              <div className="text-fluid-micro" style={{ color: "var(--text-muted)" }}>Status</div>
              <div className="font-bold text-emerald-600">Graded</div>
            </div>
          </div>

          {/* Answer review */}
          <div className="mt-5 text-left max-h-72 overflow-y-auto space-y-2">
            {questions.map((q, i) => {
              const userAns = answers[q.id];
              const correct = userAns === q.correct_answer;
              return (
                <div key={q.id} className={`rounded-xl border p-3 text-fluid-caption ${
                  correct ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5"
                }`}>
                  <div className="font-medium">Q{i + 1}. {q.question_text}</div>
                  <div className="mt-1 text-fluid-micro">
                    Your answer: <strong>{userAns || "—"}</strong>
                    {!correct && <> · Correct: <strong className="text-emerald-700">{q.correct_answer}</strong></>}
                  </div>
                </div>
              );
            })}
          </div>

          <button onClick={() => router.push("/student/")}
            className="mt-5 w-full rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 py-3 text-[13px] font-semibold text-white shadow">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Exam in progress
  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 border-b"
        style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <div className="min-w-0">
            <div className="text-[13px] font-semibold truncate">{exam.title}</div>
            <div className="text-fluid-micro" style={{ color: "var(--text-muted)" }}>
              {questions.length} questions · {Object.keys(answers).length} answered
            </div>
          </div>
          <div className={`rounded-2xl px-4 py-2 text-[16px] font-mono font-bold ${
            timeLeft < 60 ? "bg-rose-500/15 text-rose-700" : "bg-emerald-500/15 text-emerald-700"
          }`}>
            ⏱ {mm}:{ss}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6 space-y-4">
        {questions.map((q, i) => (
          <div key={q.id} className="rounded-2xl border p-5"
            style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-fluid-caption font-bold">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium">{q.question_text}</div>
                <div className="text-fluid-micro mt-1" style={{ color: "var(--text-muted)" }}>
                  {q.marks} mark{q.marks !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
            {q.options && (
              <div className="mt-3 space-y-2">
                {q.options.map((opt: any) => {
                  const active = answers[q.id] === opt.key;
                  return (
                    <button key={opt.key} type="button"
                      onClick={() => setAnswers({ ...answers, [q.id]: opt.key })}
                      className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                        active ? "bg-emerald-500/10 border-emerald-500/40" : ""
                      }`}
                      style={!active ? { borderColor: "var(--border)" } : {}}>
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-fluid-micro font-bold ${
                        active ? "bg-emerald-500 text-white" : ""
                      }`}
                      style={!active ? { background: "var(--bg-soft)" } : {}}>
                        {opt.key}
                      </span>
                      <span className="text-[13px]">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        <div className="sticky bottom-4 z-20">
          <button onClick={submit} disabled={submitting}
            className="w-full rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 py-4 text-[15px] font-bold text-white shadow-2xl disabled:opacity-50">
            {submitting ? "Submitting..." : `✓ Submit Exam (${Object.keys(answers).length}/${questions.length} answered)`}
          </button>
        </div>
      </div>
    </div>
  );
}
