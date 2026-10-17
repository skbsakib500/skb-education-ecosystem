"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export default function AchievementsPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [allBadges, setAllBadges] = useState<any[]>([]);
  const [earned, setEarned] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login/"); return; }
    if (!user) return;
    (async () => {
      const [s, b, ub, h] = await Promise.all([
        supabase.rpc("my_gamification"),
        supabase.from("badges").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("user_badges").select("badge_id").eq("user_id", user.id),
        supabase.from("points_ledger").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
      ]);
      setStats(s.data);
      setAllBadges(b.data ?? []);
      setEarned(new Set((ub.data ?? []).map((x: any) => x.badge_id)));
      setHistory(h.data ?? []);
      setLoading(false);
    })();
  }, [user, authLoading, router]);

  if (authLoading || loading || !stats) {
    return <div className="min-h-screen flex items-center justify-center"><div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>;
  }

  const nextLevelPts = stats.next_level_points;
  const progress = stats.progress;
  const pct = Math.min(100, Math.round((progress / 500) * 100));

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 border-b"
        style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <Link href="/hub" className="text-[13px]" style={{ color: "var(--text-muted)" }}>← Hub</Link>
          <div className="flex gap-2">
            <Link href="/leaderboard" className="rounded-full border px-3 py-1.5 text-fluid-caption" style={{ borderColor: "var(--border)" }}>🏆 Leaderboard</Link>
            <button onClick={signOut} className="rounded-full border px-3 py-1.5 text-fluid-caption" style={{ borderColor: "var(--border)" }}>Sign out</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 pt-6 space-y-5">
        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-6 md:p-8 text-white relative overflow-hidden">
          <div className="pointer-events-none absolute -right-20 -top-20 h-[220px] w-[220px] rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-fluid-caption backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-amber-200 animate-pulse" />
              Level {stats.level} · Rank #{stats.rank_global}
            </div>
            <h1 className="mt-4 text-[32px] md:text-[40px] font-bold">⭐ {stats.total_points} Points</h1>
            <div className="mt-4 max-w-md">
              <div className="flex justify-between text-fluid-caption mb-1.5">
                <span>Progress to Level {stats.level + 1}</span>
                <span>{progress}/500</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.2)" }}>
                <div className="h-full rounded-full bg-white" style={{ width: pct + "%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatBox emoji="🔥" value={stats.current_streak} label="Current Streak" bn="ধারাবাহিক" />
          <StatBox emoji="🏅" value={stats.badges_count} label="Badges" bn="ব্যাজ" />
          <StatBox emoji="📈" value={stats.longest_streak} label="Longest Streak" bn="সর্বোচ্চ" />
        </div>

        {/* Badges */}
        <div>
          <h2 className="text-[16px] font-semibold mb-3">🏆 Badges ({earned.size}/{allBadges.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {allBadges.map((b) => {
              const has = earned.has(b.id);
              return (
                <div key={b.id}
                  className={"rounded-2xl border p-4 text-center transition " + (has ? "shadow-md" : "opacity-40")}
                  style={{
                    borderColor: has ? b.color + "60" : "var(--border)",
                    background: has ? b.color + "10" : "var(--surface-3)",
                  }}>
                  <div className={"text-[36px] " + (!has ? "grayscale" : "")}>{b.emoji}</div>
                  <div className="mt-2 text-[13px] font-semibold">{b.name}</div>
                  <div className="bangla text-fluid-micro" style={{ color: "var(--text-muted)" }}>{b.name_bn}</div>
                  <div className="mt-1 text-fluid-micro" style={{ color: "var(--text-faint)" }}>{b.description}</div>
                  {has && <div className="mt-2 text-[9px] font-bold uppercase" style={{ color: b.color }}>✓ Unlocked</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent activity */}
        <div>
          <h2 className="text-[16px] font-semibold mb-3">📋 Recent Activity</h2>
          {history.length === 0 ? (
            <div className="rounded-2xl border p-6 text-center text-[13px]" style={{ borderColor: "var(--border)", background: "var(--surface-3)", color: "var(--text-muted)" }}>
              No activity yet — start learning!
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((h) => (
                <div key={h.id} className="rounded-xl border p-3 flex items-center justify-between"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium capitalize">{h.action.replace(/_/g, " ")}</div>
                    <div className="text-fluid-micro" style={{ color: "var(--text-muted)" }}>
                      {h.description || ""} · {new Date(h.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span className="text-[14px] font-bold text-emerald-600">+{h.points}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function StatBox({ emoji, value, label, bn }: any) {
  return (
    <div className="rounded-2xl border p-4 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
      <div className="text-[24px]">{emoji}</div>
      <div className="text-[22px] font-bold mt-1">{value}</div>
      <div className="text-fluid-micro font-medium" style={{ color: "var(--text-muted)" }}>{label}</div>
      <div className="bangla text-fluid-micro" style={{ color: "var(--text-faint)" }}>{bn}</div>
    </div>
  );
}
