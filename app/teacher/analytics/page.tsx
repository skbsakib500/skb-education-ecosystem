"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export default function TeacherAnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [inst, setInst] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [perf, setPerf] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [perfLoading, setPerfLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: mem } = await supabase.from("memberships")
        .select("institution_id, institutions:institution_id(id, name, slug, emoji)")
        .eq("user_id", user.id).eq("role", "teacher").limit(1).maybeSingle();
      if (!mem) { setLoading(false); return; }
      setInst(mem.institutions);

      const [c, s] = await Promise.all([
        supabase.rpc("teacher_classes", { p_institution_id: mem.institution_id, p_teacher_id: user.id }),
        supabase.rpc("teacher_dashboard", { p_institution_id: mem.institution_id }),
      ]);
      setClasses(c.data ?? []);
      setStats(s.data);
      if (c.data && c.data.length > 0) setSelectedClass(c.data[0].class_id);
      setLoading(false);
    })();
  }, [user]);

  useEffect(() => {
    if (!selectedClass || !inst) return;
    setPerfLoading(true);
    (async () => {
      const { data } = await supabase.rpc("teacher_class_performance", {
        p_institution_id: inst.id, p_class_id: selectedClass,
      });
      setPerf(data ?? []);
      setPerfLoading(false);
    })();
  }, [selectedClass, inst]);

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" /></div>;

  if (!inst) return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md rounded-3xl border p-8" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
        <div className="text-[48px]">👨‍🏫</div>
        <div className="mt-3 text-[16px] font-semibold">No Teacher Access</div>
        <Link href="/hub" className="mt-5 inline-block rounded-full border px-5 py-2 text-[13px]" style={{ borderColor: "var(--border)" }}>Back to Hub</Link>
      </div>
    </main>
  );

  const top5 = [...perf].filter((p) => Number(p.avg_exam) > 0).sort((a, b) => Number(b.avg_exam) - Number(a.avg_exam)).slice(0, 5);
  const bottom5 = [...perf].filter((p) => Number(p.avg_exam) > 0).sort((a, b) => Number(a.avg_exam) - Number(b.avg_exam)).slice(0, 5);

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 border-b" style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
          <Link href="/teacher" className="text-[13px]" style={{ color: "var(--text-muted)" }}>← Teacher Portal</Link>
          <div className="text-[13px] font-semibold">📊 Class Analytics</div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 md:px-8 pt-6 space-y-5">
        <div className="rounded-3xl bg-gradient-to-br from-violet-500 via-indigo-600 to-violet-700 p-6 text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-fluid-caption backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-violet-200 animate-pulse" />
            {inst.emoji || "🏫"} {inst.name}
          </div>
          <h1 className="mt-4 text-[24px] font-semibold">📊 Class Analytics</h1>
          <p className="text-[13px] mt-1 text-violet-50/90">Your classes at a glance</p>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <KPI e="📚" v={stats.my_classes} l="Classes" />
            <KPI e="👥" v={stats.my_students} l="Students" />
            <KPI e="📅" v={stats.today_classes} l="Today" />
            <KPI e="📝" v={stats.active_assignments} l="Assignments" />
            <KPI e="⏳" v={stats.pending_grading} l="To Grade" color="#f59e0b" />
          </div>
        )}

        {classes.length > 0 && (
          <div className="rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <div className="text-[14px] font-semibold">Class Performance</div>
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
                className="rounded-full border px-3.5 py-1.5 text-fluid-caption outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                {classes.map((c: any) => <option key={c.class_id} value={c.class_id}>{c.class_name}{c.section ? " · " + c.section : ""}</option>)}
              </select>
            </div>

            {perfLoading ? (
              <div className="text-center py-8 text-[13px]" style={{ color: "var(--text-muted)" }}>Loading...</div>
            ) : perf.length === 0 ? (
              <div className="text-center py-8 text-[13px]" style={{ color: "var(--text-muted)" }}>No students in this class</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <div className="rounded-xl p-3" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                    <div className="text-fluid-micro font-bold uppercase mb-2" style={{ color: "#10b981" }}>🏆 Top 5</div>
                    {top5.map((p) => (
                      <div key={p.student_id} className="flex justify-between text-fluid-caption py-1">
                        <span className="truncate">{p.full_name}</span>
                        <span className="font-bold text-emerald-600 shrink-0 ml-2">{Number(p.avg_exam).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl p-3" style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)" }}>
                    <div className="text-fluid-micro font-bold uppercase mb-2" style={{ color: "#f43f5e" }}>⚠️ Needs Help (Bottom 5)</div>
                    {bottom5.map((p) => (
                      <div key={p.student_id} className="flex justify-between text-fluid-caption py-1">
                        <span className="truncate">{p.full_name}</span>
                        <span className="font-bold text-rose-600 shrink-0 ml-2">{Number(p.avg_exam).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
                  <table className="w-full text-fluid-caption">
                    <thead>
                      <tr style={{ background: "var(--bg-soft)" }}>
                        <th className="text-left p-2.5 font-semibold text-fluid-micro uppercase" style={{ color: "var(--text-muted)" }}>Student</th>
                        <th className="text-center p-2.5 font-semibold text-fluid-micro uppercase" style={{ color: "var(--text-muted)" }}>Att%</th>
                        <th className="text-center p-2.5 font-semibold text-fluid-micro uppercase" style={{ color: "var(--text-muted)" }}>Exam%</th>
                        <th className="text-center p-2.5 font-semibold text-fluid-micro uppercase" style={{ color: "var(--text-muted)" }}>Assgn</th>
                        <th className="text-right p-2.5 font-semibold text-fluid-micro uppercase" style={{ color: "var(--text-muted)" }}>Fee Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {perf.map((p) => (
                        <tr key={p.student_id} className="border-t" style={{ borderColor: "var(--border)" }}>
                          <td className="p-2.5">
                            <div className="font-semibold truncate max-w-[180px]">{p.full_name}</div>
                            <div className="text-fluid-micro" style={{ color: "var(--text-muted)" }}>Roll {p.roll_number || "—"}</div>
                          </td>
                          <td className="p-2.5 text-center">
                            <span className={"rounded-full px-2 py-0.5 text-fluid-micro font-semibold " +
                              (Number(p.attendance_pct) >= 80 ? "bg-emerald-500/15 text-emerald-700" :
                               Number(p.attendance_pct) >= 60 ? "bg-amber-500/15 text-amber-700" :
                               "bg-rose-500/15 text-rose-700")}>
                              {Number(p.attendance_pct).toFixed(0)}%
                            </span>
                          </td>
                          <td className="p-2.5 text-center">
                            <span className={"rounded-full px-2 py-0.5 text-fluid-micro font-semibold " +
                              (Number(p.avg_exam) >= 70 ? "bg-emerald-500/15 text-emerald-700" :
                               Number(p.avg_exam) >= 50 ? "bg-amber-500/15 text-amber-700" :
                               Number(p.avg_exam) > 0 ? "bg-rose-500/15 text-rose-700" :
                               "bg-slate-500/10 text-fg-muted")}>
                              {Number(p.avg_exam).toFixed(1)}%
                            </span>
                          </td>
                          <td className="p-2.5 text-center font-medium">{p.assignments_submitted}/{p.assignments_total}</td>
                          <td className="p-2.5 text-right">
                            <span className={"text-fluid-micro font-semibold " + (Number(p.fee_due) > 0 ? "text-rose-600" : "text-emerald-600")}>
                              ৳{Number(p.fee_due).toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function KPI({ e, v, l, color }: any) {
  return (
    <div className="rounded-2xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
      <div className="text-[16px]">{e}</div>
      <div className="text-[20px] font-bold mt-0.5" style={{ color: color || "var(--text)" }}>{v}</div>
      <div className="text-fluid-micro uppercase font-medium" style={{ color: "var(--text-muted)" }}>{l}</div>
    </div>
  );
}
