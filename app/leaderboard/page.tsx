"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export default function LeaderboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login/"); return; }
    if (!user) return;
    (async () => {
      const { data } = await supabase.rpc("get_leaderboard", { p_scope: "global", p_institution_id: null, p_limit: 50 });
      setRows(data ?? []);
      setLoading(false);
    })();
  }, [user, authLoading, router]);

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>;

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 border-b" style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link href="/achievements" className="text-[13px]" style={{ color: "var(--text-muted)" }}>← Achievements</Link>
          <div className="text-[14px] font-semibold">🏆 Global Leaderboard</div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-6">
        {/* Top 3 podium */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1, 0, 2].map((idx) => {
            const p = top3[idx];
            if (!p) return <div key={idx} />;
            const heights: any = { 0: "h-24", 1: "h-32", 2: "h-20" };
            const colors: any = { 0: "#fbbf24", 1: "#e5e7eb", 2: "#d97706" };
            const medals: any = { 0: "🥇", 1: "🥈", 2: "🥉" };
            const initials = (p.full_name || "U").slice(0, 2).toUpperCase();
            return (
              <div key={idx} className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full text-[18px] font-bold text-white border-4"
                    style={{ background: "linear-gradient(135deg,#10b981,#14b8a6)", borderColor: colors[idx] }}>
                    {p.avatar_url ? <img src={p.avatar_url} alt="" className="h-full w-full object-cover rounded-full" /> : initials}
                  </div>
                </div>
                <div className="text-[12px] font-semibold truncate">{p.full_name}</div>
                <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>⭐ {p.total_points}</div>
                <div className={"mt-2 rounded-t-xl flex items-end justify-center pb-1 " + heights[idx]}
                  style={{ background: colors[idx] }}>
                  <span className="text-[20px]">{medals[idx]}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rest */}
        <div className="space-y-1">
          {rest.map((r, i) => {
            const initials = (r.full_name || "U").slice(0, 2).toUpperCase();
            const isMe = r.user_id === user?.id;
            return (
              <Link key={r.user_id} href={"/u/?username=" + (r.username || "")}
                className={"flex items-center gap-3 rounded-2xl border p-3 transition hover:bg-[var(--bg-soft)] " + (isMe ? "ring-2 ring-emerald-500/40" : "")}
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <div className="w-8 text-center text-[13px] font-bold" style={{ color: "var(--text-muted)" }}>#{Number(r.rank)}</div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold text-white shrink-0"
                  style={{ background: "linear-gradient(135deg,#10b981,#14b8a6)" }}>
                  {r.avatar_url ? <img src={r.avatar_url} alt="" className="h-full w-full object-cover rounded-full" /> : initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold truncate">
                    {r.full_name} {isMe && <span className="text-[10px] text-emerald-600">(You)</span>}
                  </div>
                  <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    LV {r.level} · 🏅 {r.badges_count} · 🔥 {r.current_streak}
                  </div>
                </div>
                <div className="text-[14px] font-bold text-emerald-600 shrink-0">⭐ {r.total_points}</div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
