"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import NotificationCenter from "@/components/NotificationCenter";
import PointsBadge from "@/components/gamification/PointsBadge";

export default function ParentPortal() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [children, setChildren] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.rpc("my_children_summary");
    setChildren(data ?? []);
    if (data && data.length > 0) setSelected(data[0]);
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading && !user) router.push("/login/");
  }, [user, authLoading, router]);

  useEffect(() => { if (user) load(); }, [user]);

  useEffect(() => {
    if (!selected) return;
    setActivityLoading(true);
    (async () => {
      const { data } = await supabase.rpc("child_recent_activity", { p_student_id: selected.student_id, p_limit: 20 });
      setActivity(data ?? []);
      setActivityLoading(false);
    })();
  }, [selected]);

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><div className="inline-block h-10 w-10 animate-spin rounded-full border-4 from-cyan-500 border-t-transparent" style={{ border: "4px solid #06b6d4", borderTopColor: "transparent" }} /></div>;

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 border-b" style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
          <Link href="/hub" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white font-bold text-[13px] shadow-lg">👪</div>
            <div className="leading-tight">
              <div className="text-[14px] font-semibold">Parent Portal</div>
              <div className="bangla text-[11px]" style={{ color: "var(--text-muted)" }}>অভিভাবক পোর্টাল</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <PointsBadge />
            <NotificationCenter />
            <button onClick={signOut} className="rounded-full border px-3.5 py-1.5 text-[12px]" style={{ borderColor: "var(--border)" }}>Sign out</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 md:px-8 pt-6">
        {children.length === 0 ? (
          <div className="rounded-2xl border p-12 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            <div className="text-[48px]">👪</div>
            <div className="mt-3 text-[16px] font-semibold">No children linked yet</div>
            <div className="bangla text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>
              প্রতিষ্ঠান admin আপনার email দিয়ে invitation পাঠালে auto-link হবে
            </div>
          </div>
        ) : (
          <>
            {/* Children tabs */}
            {children.length > 1 && (
              <div className="flex gap-2 overflow-x-auto mb-4">
                {children.map((c) => (
                  <button key={c.student_id} onClick={() => setSelected(c)}
                    className={"rounded-full border px-4 py-2 text-[13px] font-medium whitespace-nowrap transition " + (selected?.student_id === c.student_id ? "bg-teal-500/15 border-teal-500/40 text-teal-700" : "")}
                    style={selected?.student_id !== c.student_id ? { borderColor: "var(--border)" } : {}}>
                    {c.full_name.split(" ")[0]}
                  </button>
                ))}
              </div>
            )}

            {/* Selected child hero */}
            <ChildHero child={selected} />

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              <StatCard label="Attendance" bn="উপস্থিতি" value={Number(selected.attendance_pct).toFixed(1) + "%"} color={Number(selected.attendance_pct) >= 80 ? "#10b981" : Number(selected.attendance_pct) >= 60 ? "#f59e0b" : "#f43f5e"} emoji="✅" />
              <StatCard label="Avg Exam" bn="গড় নম্বর" value={Number(selected.avg_exam).toFixed(1) + "%"} color={Number(selected.avg_exam) >= 70 ? "#10b981" : Number(selected.avg_exam) >= 50 ? "#f59e0b" : "#f43f5e"} emoji="📊" />
              <StatCard label="Fee Due" bn="বাকি" value={"৳" + Number(selected.fee_due).toLocaleString()} color={Number(selected.fee_due) > 0 ? "#f43f5e" : "#10b981"} emoji="💰" />
            </div>

            {/* Quick actions */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              <QuickLink href={"/u/?username="} icon="📅" title="Routine" bn="রুটিন" />
              <QuickLink href={"/messages"} icon="💬" title="Messages" bn="বার্তা" />
              <QuickLink href={"/materials"} icon="📚" title="Materials" bn="সামগ্রী" />
              <QuickLink href={"/journals"} icon="📔" title="Journals" bn="জার্নাল" />
            </div>

            {/* Activity feed */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[16px] font-semibold">Recent Activity · <span className="bangla font-normal">সাম্প্রতিক কার্যক্রম</span></h2>
                <button onClick={() => setSelected({ ...selected })} className="text-[12px] font-medium text-teal-700">🔄 Refresh</button>
              </div>

              {activityLoading ? (
                <div className="text-center py-10"><div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" /></div>
              ) : activity.length === 0 ? (
                <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                  <div className="text-[36px]">📭</div>
                  <div className="mt-2 text-[14px] font-semibold">No activity yet</div>
                </div>
              ) : (
                <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                  {activity.map((a, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 border-b last:border-b-0" style={{ borderColor: "var(--border)" }}>
                      <div className={"flex h-10 w-10 items-center justify-center rounded-xl text-[18px] shrink-0 " +
                        (a.kind === "attendance" ? "bg-emerald-500/15" :
                         a.kind === "exam" ? "bg-violet-500/15" :
                         a.kind === "fee" ? "bg-amber-500/15" :
                         "bg-cyan-500/15")}>
                        {a.kind === "attendance" ? "✅" : a.kind === "exam" ? "📊" : a.kind === "fee" ? "💰" : "📓"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-semibold">{a.title}</div>
                        {a.description && <div className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{a.description}</div>}
                        <div className="text-[10px] mt-1" style={{ color: "var(--text-faint)" }}>
                          {new Date(a.at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function ChildHero({ child }: any) {
  if (!child) return null;
  const initials = child.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="rounded-3xl bg-gradient-to-br from-teal-500 via-cyan-600 to-teal-700 p-6 text-white relative overflow-hidden">
      <div className="pointer-events-none absolute -right-20 -top-20 h-[220px] w-[220px] rounded-full bg-white/10 blur-3xl" />
      <div className="relative flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur text-[24px] font-bold shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[22px] font-semibold truncate">{child.full_name}</div>
          <div className="flex flex-wrap gap-2 mt-1 text-[11px]">
            {child.student_code && <span className="rounded-full bg-white/15 px-2 py-0.5 font-mono">🆔 {child.student_code}</span>}
            {child.class_name && <span className="rounded-full bg-white/15 px-2 py-0.5">📚 {child.class_name}{child.section ? " · " + child.section : ""}</span>}
            <span className="rounded-full bg-white/15 px-2 py-0.5">{child.institution_emoji || "🏫"} {child.institution_name}</span>
          </div>
          {child.relationship && <div className="text-[11px] mt-2 opacity-90">Your relationship: <span className="capitalize font-semibold">{child.relationship}</span></div>}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, bn, value, color, emoji }: any) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
      <div className="text-[18px]">{emoji}</div>
      <div className="text-[22px] font-bold mt-1" style={{ color }}>{value}</div>
      <div className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>{label}</div>
      <div className="bangla text-[10px]" style={{ color: "var(--text-faint)" }}>{bn}</div>
    </div>
  );
}

function QuickLink({ href, icon, title, bn }: any) {
  return (
    <Link href={href}
      className="rounded-2xl border p-4 text-center transition hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
      <div className="text-[24px]">{icon}</div>
      <div className="mt-2 text-[12px] font-semibold">{title}</div>
      <div className="bangla text-[10px]" style={{ color: "var(--text-faint)" }}>{bn}</div>
    </Link>
  );
}
