"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export default function TeacherPortal() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [memberships, setMemberships] = useState<any[]>([]);
  const [selectedInst, setSelectedInst] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("memberships")
        .select("id, role, institution_id, institutions:institution_id(id, name, slug, emoji, logo_url, academic_stream)")
        .eq("user_id", user.id).eq("role", "teacher");
      setMemberships(data ?? []);
      if (data && data.length > 0) setSelectedInst(data[0]);
      setLoading(false);
    })();
  }, [user]);

  useEffect(() => {
    if (!selectedInst || !user) return;
    (async () => {
      const [cRes, eRes] = await Promise.all([
        supabase.rpc("teacher_classes", { p_institution_id: selectedInst.institution_id, p_teacher_id: user.id }),
        supabase.from("exams").select("*, classes:class_id(name)").eq("institution_id", selectedInst.institution_id)
          .eq("status", "published").order("created_at", { ascending: false }).limit(10),
      ]);
      setClasses(cRes.data ?? []);
      setUpcomingExams(eRes.data ?? []);
    })();
  }, [selectedInst, user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (memberships.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md rounded-2xl border p-8"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="text-[48px]">👨‍🏫</div>
          <div className="mt-3 text-[16px] font-semibold">No Teacher Access</div>
          <div className="bangla text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>
            কোনো প্রতিষ্ঠান থেকে teacher invitation পাননি
          </div>
          <Link href="/dashboard" className="mt-5 inline-block rounded-full border px-5 py-2 text-[13px]"
            style={{ borderColor: "var(--border)" }}>
            Go to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const inst = selectedInst.institutions;

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 border-b"
        style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
          <Link href="/teacher" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-[14px] font-bold shadow-lg">👨‍🏫</div>
            <div className="leading-tight">
              <div className="text-[14px] font-semibold">Teacher Portal</div>
              <div className="bangla text-[11px]" style={{ color: "var(--text-muted)" }}>শিক্ষক পোর্টাল</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {memberships.length > 1 && (
              <select value={selectedInst.institution_id}
                onChange={(e) => setSelectedInst(memberships.find((m) => m.institution_id === e.target.value))}
                className="rounded-full border px-3 py-1.5 text-[12px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                {memberships.map((m) => (
                  <option key={m.id} value={m.institution_id}>{m.institutions?.name}</option>
                ))}
              </select>
            )}
            <button onClick={signOut} className="rounded-full border px-3.5 py-1.5 text-[12px]"
              style={{ borderColor: "var(--border)" }}>Sign out</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 md:px-8 pt-8">
        <div className="rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-violet-700 p-6 md:p-8 text-white relative overflow-hidden">
          <div className="pointer-events-none absolute -right-20 -top-20 h-[220px] w-[220px] rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex flex-col md:flex-row md:items-center gap-5">
            <div className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-3xl border-4 text-[28px] overflow-hidden shrink-0"
              style={{ borderColor: "rgba(255,255,255,0.3)", background: "white" }}>
              {inst?.logo_url ? <img src={inst.logo_url} alt="" className="h-full w-full object-cover" /> : (inst?.emoji || "🏫")}
            </div>
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-violet-200 animate-pulse" />
                Teacher Access
              </div>
              <h1 className="mt-3 text-[22px] md:text-[28px] font-semibold truncate">{inst?.name}</h1>
              <div className="mt-2 text-[12px] opacity-90">
                {classes.length}টি class · {upcomingExams.length}টি published exam
              </div>
            </div>
          </div>
        </div>

        {/* My Classes */}
        <div className="mt-6 flex justify-end">
          <Link href="/teacher/analytics" className="rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 px-4 py-2 text-[12px] font-semibold text-white shadow">
            📊 Class Analytics
          </Link>
        </div>

        <div className="mt-8">
          <h2 className="text-[16px] font-semibold mb-3">My Classes · <span className="bangla font-normal">আমার শ্রেণি</span></h2>
          {classes.length === 0 ? (
            <div className="rounded-2xl border p-8 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <div className="text-[32px]">📚</div>
              <div className="mt-2 text-[13px]" style={{ color: "var(--text-muted)" }}>No classes assigned yet</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {classes.map((c: any) => (
                <Link key={c.class_id} href={"/institutions/view/?slug=" + inst.slug}
                  className="rounded-2xl border p-4 hover:-translate-y-0.5 transition"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-[18px]">
                      📚
                    </div>
                    <div className="min-w-0">
                      <div className="text-[14px] font-semibold truncate">{c.class_name}</div>
                      {c.section && <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>Section {c.section}</div>}
                    </div>
                    {c.is_primary && (
                      <span className="ml-auto rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        Primary
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Published Exams */}
        <div className="mt-8">
          <h2 className="text-[16px] font-semibold mb-3">Published Exams · <span className="bangla font-normal">প্রকাশিত পরীক্ষা</span></h2>
          {upcomingExams.length === 0 ? (
            <div className="rounded-2xl border p-8 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <div className="text-[32px]">📝</div>
              <div className="mt-2 text-[13px]" style={{ color: "var(--text-muted)" }}>No published exams</div>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingExams.map((e) => (
                <div key={e.id} className="rounded-2xl border p-4 flex items-center justify-between"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold">{e.title}</div>
                    <div className="flex flex-wrap gap-2 mt-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {e.subject && <span>📖 {e.subject}</span>}
                      {e.classes?.name && <span>🎓 {e.classes.name}</span>}
                      <span>🎯 {e.total_marks} marks</span>
                    </div>
                  </div>
                  <Link href={"/institutions/view/?slug=" + inst.slug}
                    className="rounded-full bg-violet-500/15 px-3 py-1 text-[11px] font-semibold text-violet-700">
                    View
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
