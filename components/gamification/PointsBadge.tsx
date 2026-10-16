"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export default function PointsBadge() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.rpc("my_gamification");
      setStats(data);
    })();
    // Daily streak update on load
    supabase.rpc("update_my_streak");
  }, [user]);

  if (!user || !stats) return null;

  return (
    <Link href="/achievements"
      className="flex items-center gap-2 rounded-full border px-3 py-1.5 transition hover:border-emerald-500/40"
      style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
      <span className="text-[14px]">⭐</span>
      <span className="text-[12px] font-semibold">{stats.total_points}</span>
      {stats.current_streak > 0 && (
        <>
          <span className="h-3 w-px" style={{ background: "var(--border)" }} />
          <span className="text-[12px]">🔥 {stats.current_streak}</span>
        </>
      )}
      <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
        LV {stats.level}
      </span>
    </Link>
  );
}
