"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login/"); return; }
    if (!user) return;
    (async () => {
      const { data } = await supabase.rpc("platform_analytics", { p_days: days });
      setData(data);
      setLoading(false);
    })();
  }, [user, authLoading, router, days]);

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>;

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-[36px]">🔒</div>
        <div className="mt-2 text-[14px] font-semibold">Platform admin only</div>
        <Link href="/hub" className="mt-4 inline-block rounded-full border px-5 py-2 text-[13px]" style={{ borderColor: "var(--border)" }}>Back</Link>
      </div>
    </div>
  );

  const trend = data.signup_trend || [];
  const maxSignup = Math.max(1, ...trend.map((t: any) => t.count));

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 border-b" style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
          <Link href="/super-admin" className="text-[13px]" style={{ color: "var(--text-muted)" }}>← Super Admin</Link>
          <select value={days} onChange={(e) => setDays(parseInt(e.target.value))}
            className="rounded-full border px-3 py-1.5 text-[12px] outline-none"
            style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 md:px-8 pt-6 space-y-6">
        <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 p-6 text-white">
          <h1 className="text-[24px] font-semibold">📊 Platform Analytics</h1>
          <p className="text-[13px] mt-1 text-violet-50/90">Last {days} days overview</p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPI label="New Users (today)" value={data.new_users.today} bn="নতুন ব্যবহারকারী" color="#10b981" />
          <KPI label="New Users (week)" value={data.new_users.week} bn="এই সপ্তাহে" color="#14b8a6" />
          <KPI label="New Institutions" value={data.new_institutions.month} bn="নতুন প্রতিষ্ঠান" color="#8b5cf6" />
          <KPI label="Points Awarded" value={Number(data.engagement.total_points_awarded).toLocaleString()} bn="মোট পয়েন্ট" color="#f59e0b" />
        </div>

        {/* Signup trend chart */}
        <div className="rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="text-[13px] font-semibold mb-3">📈 Signup Trend (Last {days} days)</div>
          <div className="flex items-end gap-0.5 h-32">
            {trend.map((t: any, i: number) => {
              const h = Math.max(2, (t.count / maxSignup) * 100);
              return (
                <div key={i} className="flex-1 rounded-t transition hover:opacity-80"
                  title={`${t.date}: ${t.count} signups`}
                  style={{ height: h + "%", background: "linear-gradient(180deg,#10b981,#14b8a6)", minHeight: "3px" }} />
              );
            })}
          </div>
        </div>

        {/* Activity grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card title="Today's Activity" bn="আজকের কার্যক্রম">
            <Row label="Posts" value={data.activity.posts_today} />
            <Row label="Messages" value={data.activity.messages_today} />
            <Row label="Exam attempts" value={data.activity.exam_attempts_today} />
            <Row label="New discussions" value={data.activity.new_discussions_today} />
          </Card>

          <Card title="Engagement" bn="এনগেজমেন্ট">
            <Row label="Total posts" value={Number(data.engagement.total_posts).toLocaleString()} />
            <Row label="Total messages" value={Number(data.engagement.total_messages).toLocaleString()} />
            <Row label="Total follows" value={Number(data.engagement.total_follows).toLocaleString()} />
            <Row label="Badges earned" value={Number(data.engagement.total_badges_earned).toLocaleString()} />
          </Card>

          <Card title="Top Institutions" bn="শীর্ষ প্রতিষ্ঠান">
            {(data.top_institutions || []).map((i: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between py-1.5 border-b last:border-b-0" style={{ borderColor: "var(--border)" }}>
                <div className="text-[12px] font-medium truncate">{i.emoji || "🏫"} {i.name}</div>
                <div className="text-[11px] shrink-0" style={{ color: "var(--text-muted)" }}>👥 {i.students}</div>
              </div>
            ))}
            {(!data.top_institutions || data.top_institutions.length === 0) && (
              <div className="text-[12px]" style={{ color: "var(--text-muted)" }}>No institutions yet</div>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}

function KPI({ label, value, bn, color }: any) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
      <div className="text-[24px] font-bold" style={{ color }}>{value}</div>
      <div className="text-[11px] font-medium mt-1" style={{ color: "var(--text-muted)" }}>{label}</div>
      <div className="bangla text-[10px]" style={{ color: "var(--text-faint)" }}>{bn}</div>
    </div>
  );
}

function Card({ title, bn, children }: any) {
  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
      <div className="text-[13px] font-semibold mb-3">{title} <span className="bangla font-normal text-[11px]" style={{ color: "var(--text-muted)" }}>· {bn}</span></div>
      {children}
    </div>
  );
}

function Row({ label, value }: any) {
  return (
    <div className="flex justify-between py-1.5 border-b last:border-b-0 text-[12px]" style={{ borderColor: "var(--border)" }}>
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
