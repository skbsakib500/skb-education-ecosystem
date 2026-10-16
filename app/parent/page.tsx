"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export default function ParentPortal() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("parent_student_links")
        .select("*, students:student_id(id, full_name, student_id, roll_number, class_id, institutions:institution_id(name, emoji, logo_url), classes:class_id(name, section))")
        .eq("parent_user_id", user.id);
      setChildren(data ?? []);
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

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 border-b"
        style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
          <Link href="/parent" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white font-bold text-[13px] shadow-lg">
              👪
            </div>
            <div className="leading-tight">
              <div className="text-[14px] font-semibold">Parent Portal</div>
              <div className="bangla text-[11px]" style={{ color: "var(--text-muted)" }}>অভিভাবক পোর্টাল</div>
            </div>
          </Link>
          <button onClick={signOut} className="rounded-full border px-3.5 py-1.5 text-[12px] font-medium"
            style={{ borderColor: "var(--border)" }}>
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 md:px-8 pt-8">
        <div className="rounded-3xl bg-gradient-to-br from-teal-600 via-cyan-600 to-teal-700 p-6 md:p-8 text-white overflow-hidden relative">
          <div className="pointer-events-none absolute -right-20 -top-20 h-[220px] w-[220px] rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[12px] backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-cyan-200 animate-pulse" />
              Parent Access
            </div>
            <h1 className="mt-4 text-[26px] md:text-[32px] font-semibold">আপনার সন্তানের অগ্রগতি</h1>
            <p className="mt-2 text-[14px] text-cyan-50/90">
              {children.length > 0
                ? `${children.length}টি সন্তানের তথ্য দেখছেন।`
                : "কোনো সন্তান এখনো link হয়নি। প্রতিষ্ঠান থেকে invitation পেলে auto-link হবে।"}
            </p>
          </div>
        </div>

        {children.length === 0 ? (
          <div className="mt-8 rounded-2xl border p-10 text-center"
            style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            <div className="text-[48px]">👪</div>
            <div className="mt-3 text-[16px] font-semibold">No children linked yet</div>
            <div className="bangla text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>
              প্রতিষ্ঠান admin আপনার email দিয়ে invitation পাঠালে auto-link হবে
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {children.map((c: any) => (
              <ChildCard key={c.id} link={c} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function ChildCard({ link }: { link: any }) {
  const s = link.students;
  const [attendance, setAttendance] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [tab, setTab] = useState<"overview"|"attendance"|"exams"|"fees">("overview");

  useEffect(() => {
    if (!s) return;
    (async () => {
      const [aRes, eRes, fRes] = await Promise.all([
        supabase.from("attendance").select("status, date").eq("student_id", s.id)
          .order("date", { ascending: false }).limit(30),
        supabase.from("exam_attempts").select("*, exams:exam_id(title, subject, total_marks)")
          .eq("student_id", s.id).order("submitted_at", { ascending: false }).limit(10),
        supabase.from("fee_payments").select("*").eq("student_id", s.id)
          .order("created_at", { ascending: false }).limit(20),
      ]);
      setAttendance(aRes.data ?? []);
      setExams(eRes.data ?? []);
      setFees(fRes.data ?? []);
    })();
  }, [s?.id]);

  if (!s) return null;

  const presentCount = attendance.filter((a) => a.status === "present" || a.status === "late").length;
  const attendancePct = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;
  const avgExam = exams.filter((e) => e.status === "graded" && e.total_marks > 0).length > 0
    ? Math.round(exams.filter((e) => e.status === "graded").reduce((sum, e) => sum + (e.score / e.total_marks) * 100, 0) / exams.filter((e) => e.status === "graded").length)
    : 0;
  const totalPending = fees.filter((f) => f.status !== "paid" && f.status !== "waived").reduce((s, f) => s + (Number(f.amount) - Number(f.paid_amount)), 0);

  return (
    <div className="rounded-3xl border overflow-hidden"
      style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
      {/* Child header */}
      <div className="p-5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur text-[24px] font-bold">
            {s.institutions?.emoji || "🏫"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[18px] font-bold truncate">{s.full_name}</div>
            <div className="flex flex-wrap gap-2 mt-1 text-[11px]">
              {s.student_id && <span className="rounded-full bg-white/15 px-2 py-0.5 font-mono">🆔 {s.student_id}</span>}
              {s.classes?.name && <span className="rounded-full bg-white/15 px-2 py-0.5">📚 {s.classes.name}</span>}
              <span className="rounded-full bg-white/15 px-2 py-0.5">{s.institutions?.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-0 border-b" style={{ borderColor: "var(--border)" }}>
        <QuickStat label="Attendance" bn="উপস্থিতি" value={attendancePct + "%"} color={attendancePct >= 80 ? "#10b981" : attendancePct >= 60 ? "#f59e0b" : "#f43f5e"} />
        <QuickStat label="Avg Exam" bn="গড় নম্বর" value={avgExam + "%"} color={avgExam >= 70 ? "#10b981" : avgExam >= 50 ? "#f59e0b" : "#f43f5e"} />
        <QuickStat label="Fees Due" bn="বকেয়া" value={"৳" + totalPending.toLocaleString()} color={totalPending > 0 ? "#f43f5e" : "#10b981"} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-2 border-b overflow-x-auto" style={{ borderColor: "var(--border)" }}>
        {[
          { k: "overview", l: "Overview", e: "📊" },
          { k: "attendance", l: "Attendance", e: "✅" },
          { k: "exams", l: "Results", e: "📝" },
          { k: "fees", l: "Fees", e: "💵" },
        ].map((t) => (
          <button key={t.k} onClick={() => setTab(t.k as any)}
            className={"rounded-lg px-3 py-1.5 text-[12px] font-medium whitespace-nowrap " + (tab === t.k ? "bg-emerald-500/15 text-emerald-700" : "")}
            style={tab !== t.k ? { color: "var(--text-muted)" } : {}}>
            {t.e} {t.l}
          </button>
        ))}
      </div>

      <div className="p-5">
        {tab === "overview" && (
          <div className="space-y-2">
            <InfoRow label="Guardian" value={link.relationship || "Guardian"} />
            <InfoRow label="Roll Number" value={s.roll_number || "—"} />
            <InfoRow label="Institution" value={s.institutions?.name || "—"} />
            <InfoRow label="Class" value={s.classes?.name ? s.classes.name + (s.classes.section ? " · " + s.classes.section : "") : "—"} />
          </div>
        )}

        {tab === "attendance" && (
          attendance.length === 0 ? <Empty icon="✅" text="No attendance records" /> : (
            <div className="grid grid-cols-7 gap-1.5">
              {attendance.slice(0, 28).reverse().map((a) => (
                <div key={a.date} title={a.date + " · " + a.status}
                  className="aspect-square rounded-lg flex items-center justify-center text-[10px]"
                  style={{
                    background: a.status === "present" ? "rgba(16,185,129,0.2)" :
                               a.status === "absent" ? "rgba(244,63,94,0.2)" :
                               a.status === "late" ? "rgba(245,158,11,0.2)" :
                               "rgba(100,116,139,0.15)",
                    color: a.status === "present" ? "#059669" :
                           a.status === "absent" ? "#e11d48" :
                           a.status === "late" ? "#d97706" : "#64748b",
                  }}>
                  {a.status[0].toUpperCase()}
                </div>
              ))}
            </div>
          )
        )}

        {tab === "exams" && (
          exams.length === 0 ? <Empty icon="📝" text="No exam results yet" /> : (
            <div className="space-y-2">
              {exams.map((e) => {
                const pct = e.total_marks > 0 ? Math.round((e.score / e.total_marks) * 100) : 0;
                return (
                  <div key={e.id} className="rounded-xl border p-3 flex items-center justify-between"
                    style={{ borderColor: "var(--border)" }}>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium truncate">{e.exams?.title}</div>
                      <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>{e.exams?.subject}</div>
                    </div>
                    <div className="text-right">
                      <div className={"text-[16px] font-bold " + (pct >= 70 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-rose-600")}>
                        {pct}%
                      </div>
                      <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>{e.score}/{e.total_marks}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {tab === "fees" && (
          fees.length === 0 ? <Empty icon="💵" text="No fee records" /> : (
            <div className="space-y-2">
              {fees.map((f) => (
                <div key={f.id} className="rounded-xl border p-3 flex items-center justify-between"
                  style={{ borderColor: "var(--border)" }}>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium">{f.fee_name || "Fee"}</div>
                    <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {f.month && f.month + " "}{f.year}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[14px] font-bold">৳{Number(f.paid_amount).toLocaleString()}<span className="text-[11px] font-normal" style={{ color: "var(--text-muted)" }}>/{Number(f.amount).toLocaleString()}</span></div>
                    <span className={"inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                      (f.status === "paid" ? "bg-emerald-500/15 text-emerald-700" :
                       f.status === "partial" ? "bg-amber-500/15 text-amber-700" :
                       "bg-slate-500/10 text-slate-600")}>{f.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function QuickStat({ label, bn, value, color }: { label: string; bn: string; value: string; color: string }) {
  return (
    <div className="p-3 text-center border-r last:border-r-0" style={{ borderColor: "var(--border)" }}>
      <div className="text-[18px] font-bold" style={{ color }}>{value}</div>
      <div className="text-[10px] uppercase font-medium" style={{ color: "var(--text-muted)" }}>{label}</div>
      <div className="bangla text-[10px]" style={{ color: "var(--text-faint)" }}>{bn}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b last:border-b-0 text-[12px]"
      style={{ borderColor: "var(--border)" }}>
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="text-center py-8">
      <div className="text-[32px]">{icon}</div>
      <div className="mt-2 text-[12px]" style={{ color: "var(--text-muted)" }}>{text}</div>
    </div>
  );
}
