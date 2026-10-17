"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

const SUBJECTS = ["Physics","Chemistry","Biology","Math","English","Bangla","ICT","Accounting","Economics","Arabic"];
const MODES = ["online","offline","both"];

export default function TutorsPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [tutors, setTutors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState<string>("");
  const [mode, setMode] = useState<string>("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login/");
  }, [user, authLoading, router]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.rpc("search_tutors", {
      p_query: q, p_subject: subject || null, p_mode: mode || null, p_limit: 30,
    });
    setTutors(data ?? []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 border-b"
        style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/marketplace" className="text-[13px]" style={{ color: "var(--text-muted)" }}>← Marketplace</Link>
          <div className="flex items-center gap-2">
            <Link href="/tutors/become" className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-1.5 text-fluid-caption font-semibold text-white shadow">Become a Tutor</Link>
            <button onClick={signOut} className="rounded-full border px-3 py-1.5 text-fluid-caption" style={{ borderColor: "var(--border)" }}>Sign out</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pt-6">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-6 text-white">
          <h1 className="text-[24px] font-semibold">🎓 Find a Tutor</h1>
          <p className="text-[13px] mt-1 text-emerald-50/90">Subjects, level, location অনুযায়ী tutor খুঁজুন</p>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="🔍 Name, subject, headline..."
            className="rounded-full border px-4 py-2.5 text-[13px] outline-none"
            style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
          <select value={subject} onChange={(e) => { setSubject(e.target.value); }}
            className="rounded-full border px-4 py-2.5 text-[13px] outline-none"
            style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            <option value="">All subjects</option>
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={mode} onChange={(e) => { setMode(e.target.value); }}
            className="rounded-full border px-4 py-2.5 text-[13px] outline-none"
            style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            <option value="">Any mode</option>
            {MODES.map((m) => <option key={m} value={m} className="capitalize">{m}</option>)}
          </select>
        </div>

        <div className="mt-3 flex justify-end">
          <button onClick={load} className="rounded-full bg-emerald-500/15 px-4 py-1.5 text-fluid-caption font-semibold text-emerald-700">Apply filters</button>
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>
        ) : tutors.length === 0 ? (
          <div className="mt-6 rounded-2xl border p-12 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            <div className="text-[48px]">🎓</div>
            <div className="mt-3 text-[15px] font-semibold">No tutors found</div>
            <div className="bangla text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন</div>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
            {tutors.map((t) => {
              const initials = (t.full_name || "T").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
              return (
                <Link key={t.user_id} href={"/u/?username=" + (t.username || "")}
                  className="rounded-2xl border p-4 hover:-translate-y-0.5 hover:shadow-md transition"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                  <div className="flex items-start gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-[16px] font-bold text-white shrink-0"
                      style={{ background: "linear-gradient(135deg,#10b981,#14b8a6)" }}>
                      {t.avatar_url ? <img src={t.avatar_url} alt="" className="h-full w-full object-cover rounded-2xl" /> : initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-semibold truncate">{t.full_name}</div>
                      <div className="text-fluid-micro" style={{ color: "var(--text-muted)" }}>@{t.username}</div>
                      {t.headline && <div className="text-fluid-caption mt-1 line-clamp-1">{t.headline}</div>}
                    </div>
                    {t.rating_avg > 0 && (
                      <div className="text-right shrink-0">
                        <div className="text-[14px] font-bold text-amber-600">⭐ {Number(t.rating_avg).toFixed(1)}</div>
                        <div className="text-fluid-micro" style={{ color: "var(--text-faint)" }}>{t.rating_count} reviews</div>
                      </div>
                    )}
                  </div>

                  {Array.isArray(t.subjects) && t.subjects.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {t.subjects.slice(0, 4).map((s: string) => (
                        <span key={s} className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-fluid-micro font-medium text-emerald-700">{s}</span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between text-fluid-micro">
                    <span style={{ color: "var(--text-muted)" }}>
                      {t.city || t.division ? `📍 ${t.city || t.division}` : ""}
                    </span>
                    <span className="font-semibold text-emerald-700">
                      {t.hourly_rate_bdt ? `৳${t.hourly_rate_bdt}/hr` : "Negotiable"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
