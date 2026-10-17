"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Stats = {
  institutions: number;
  users: number;
  posts: number;
};

export default function LandingStats() {
  const [stats, setStats] = useState<Stats>({
    institutions: 0,
    users: 0,
    posts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        const [inst, users, posts] = await Promise.all([
          supabase
            .from("institutions")
            .select("id", { count: "exact", head: true }),
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase
            .from("social_posts")
            .select("id", { count: "exact", head: true }),
        ]);

        if (cancelled) return;

        setStats({
          institutions: inst.count ?? 0,
          users: users.count ?? 0,
          posts: posts.count ?? 0,
        });
      } catch {
        // Silent fail — show zeros rather than block landing
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStats();
    return () => {
      cancelled = true;
    };
  }, []);

  const items = [
    {
      value: stats.institutions,
      label: "Institutions",
      labelBn: "প্রতিষ্ঠান",
    },
    {
      value: stats.users,
      label: "Users",
      labelBn: "ব্যবহারকারী",
    },
    {
      value: stats.posts,
      label: "Community Posts",
      labelBn: "পোস্ট",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 md:gap-6 max-w-2xl mx-auto">
      {items.map((item) => (
        <div key={item.label} className="text-center">
          <div className="text-[26px] md:text-[36px] font-bold bg-gradient-to-br from-emerald-600 to-teal-600 bg-clip-text text-transparent tabular-nums">
            {loading ? "—" : `${item.value}+`}
          </div>
          <div className="text-[11px] md:text-[12px] font-medium mt-1">
            {item.label}
          </div>
          <div
            className="bangla text-[10px] md:text-[11px]"
            style={{ color: "var(--text-muted)" }}
          >
            {item.labelBn}
          </div>
        </div>
      ))}
    </div>
  );
}
