"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export default function StudentHome() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);
  const [recentResults, setRecentResults] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [pRes, sRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("students").select("id, institution_id, class_id, class_role, student_id, full_name, institutions:institution_id(name, slug, logo_url, emoji), classes:class_id(name, section)")
          .eq("linked_user_id", user.id),
      ]);
      setProfile(pRes.data);
      setInstitutions(sRes.data ?? []);

      // If linked student, get their exams + results
      const studentIds = (sRes.data ?? []).map((s: any) => s.id);
      if (studentIds.length > 0) {
        const [exRes, atRes] = await Promise.all([
          supabase.from("exams").select("*, institutions:institution_id(name), classes:class_id(name)")
            .in("institution_id", (sRes.data ?? []).map((s: any) => s.institution_id))
            .eq("status", "published")
            .order("start_at", { ascending: true, nullsFirst: false })
            .limit(10),
          supabase.from("exam_attempts").select("*, exams:exam_id(title, subject, total_marks)")
            .in("student_id", studentIds)
            .eq("status", "graded")
            .order("submitted_at", { ascending: false })
            .limit(5),
        ]);
        setUpcomingExams(exRes.data ?? []);
        setRecentResults(atRes.data ?? []);
      }
      setLoading(false);
    })();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  const hasStudent = institutions.length > 0;
  const firstName = (profile?.full_name || user?.email || "").split(/[\s@]/)[0];

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 border-b"
        style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
          <Link href="/student" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-[13px] shadow-lg">
              SKB
            </div>
            <div className="leading-tight">
              <div className="text-[14px] font-semibold">Student Portal</div>
              <div className="bangla text-[11px]" style={{ color: "var(--text-muted)" }}>শিক্ষার্থী পোর্টাল</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="rounded-full border px-3.5 py-1.5 text-[12px] font-medium"
              style={{ borderColor: "var(--border)" }}>
              Dashboard
            </Link>
            <button onClick={signOut} className="rounded-full border px-3.5 py-1.5 text-[12px] font-medium"
              style={{ borderColor: "var(--border)" }}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 md:px-8 pt-8">
        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-6 md:p-8 text-white overflow-hidden relative">
          <div className="pointer-events-none absolute -right-20 -top-20 h-[220px] w-[220px] rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[12px] backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-200 animate-pulse" />
              Student Workspace
            </div>
            <h1 className="mt-4 text-[26px] md:text-[32px] font-semibold">
              Assalamu Alaikum, {firstName || "Student"}!
              <span className="bangla font-medium opacity-90"> স্বাগতম</span>
            </h1>
            <p className="mt-2 text-[14px] text-emerald-50/90">
              {hasStudent
                ? `আপনি ${institutions.length}টি প্রতিষ্ঠানে যুক্ত আছেন · পরীক্ষা, ফলাফল, সবকিছু এখানে।`
                : "কোনো প্রতিষ্ঠানে এখনো যুক্ত হননি। Invitation link পেলে এখানে এসে join করুন।"}
            </p>
          </div>
        </div>

        {/* Linked institutions */}
        {hasStudent && (
          <div className="mt-6">
            <h2 className="text-[16px] font-semibold mb-3">
              My Institutions · <span className="bangla font-normal">আমার প্রতিষ্ঠান</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {institutions.map((s: any) => (
                <div key={s.id} className="rounded-2xl border p-4"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-[16px] overflow-hidden">
                      {s.institutions?.logo_url
                        ? <img src={s.institutions.logo_url} alt="" className="h-full w-full object-cover" />
                        : (s.institutions?.emoji || "🏫")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-semibold truncate">{s.institutions?.name}</div>
                      <div className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
                        🆔 {s.student_id || "Pending"}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
                    {s.classes?.name && (
                      <span className="rounded-full px-2 py-0.5 font-medium"
                        style={{ background: "var(--bg-soft)", color: "var(--text-muted)" }}>
                        📚 {s.classes.name}{s.classes.section ? " · " + s.classes.section : ""}
                      </span>
                    )}
                    {s.class_role && s.class_role !== "student" && (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-700">
                        ⭐ {s.class_role.replace("_", " ")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming exams */}
        {hasStudent && (
          <div className="mt-8">
            <h2 className="text-[16px] font-semibold mb-3">
              Upcoming Exams · <span className="bangla font-normal">আসন্ন পরীক্ষা</span>
            </h2>
            {upcomingExams.length === 0 ? (
              <EmptyBox icon="📝" title="No upcoming exams" bn="কোনো আসন্ন পরীক্ষা নেই"
                note="আপনার শিক্ষক পরীক্ষা publish করলে এখানে দেখাবে" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {upcomingExams.map((ex) => (
                  <div key={ex.id} className="rounded-2xl border p-4"
                    style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-[14px] font-semibold">{ex.title}</div>
                        <div className="text-[11px] mt-0.5 flex flex-wrap gap-2" style={{ color: "var(--text-muted)" }}>
                          {ex.subject && <span>📖 {ex.subject}</span>}
                          {ex.classes?.name && <span>🎓 {ex.classes.name}</span>}
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        {ex.type.toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px]" style={{ color: "var(--text-muted)" }}>
                      <span>⏱️ {ex.duration_minutes} min</span>
                      <span>🎯 {ex.total_marks} marks</span>
                    </div>
                    <Link href={"/student/exam/?id=" + ex.id}
                      className="mt-3 inline-block w-full rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 py-2 text-center text-[13px] font-semibold text-white shadow">
                      ▶ Start Exam
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recent results */}
        {hasStudent && recentResults.length > 0 && (
          <div className="mt-8">
            <h2 className="text-[16px] font-semibold mb-3">
              Recent Results · <span className="bangla font-normal">সাম্প্রতিক ফলাফল</span>
            </h2>
            <div className="space-y-2">
              {recentResults.map((a: any) => {
                const pct = a.total_marks > 0 ? Math.round((a.score / a.total_marks) * 100) : 0;
                const grade = pct >= 80 ? { g: "A+", c: "emerald" }
                  : pct >= 70 ? { g: "A", c: "emerald" }
                  : pct >= 60 ? { g: "A-", c: "teal" }
                  : pct >= 50 ? { g: "B", c: "amber" }
                  : pct >= 40 ? { g: "C", c: "amber" }
                  : { g: "F", c: "rose" };
                return (
                  <div key={a.id} className="rounded-2xl border p-4 flex items-center justify-between gap-3"
                    style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-semibold truncate">{a.exams?.title}</div>
                      <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                        {a.exams?.subject} · {new Date(a.submitted_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-[18px] font-bold text-${grade.c}-600`}>{a.score}/{a.total_marks}</div>
                      <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                        {pct}% · Grade {grade.g}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function EmptyBox({ icon, title, bn, note }: { icon: string; title: string; bn: string; note: string }) {
  return (
    <div className="rounded-2xl border p-10 text-center"
      style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
      <div className="text-[36px]">{icon}</div>
      <div className="mt-3 text-[15px] font-semibold">{title}</div>
      <div className="bangla text-[12px]" style={{ color: "var(--text-muted)" }}>{bn}</div>
      <div className="mt-2 text-[12px]" style={{ color: "var(--text-faint)" }}>{note}</div>
    </div>
  );
}
