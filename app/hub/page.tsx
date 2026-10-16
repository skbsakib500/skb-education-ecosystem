"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export default function HubPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    institutions: 0,
    isPlatformAdmin: false,
    isStudent: false,
    isTeacher: false,
    isParent: false,
  });

  useEffect(() => {
    if (!authLoading && !user) router.push("/login/");
  }, [user, authLoading, router]);

  // Check onboarding completion
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("onboarding_complete").eq("id", user.id).maybeSingle();
      if (!data?.onboarding_complete) {
        router.push("/onboarding/");
      }
    })();
  }, [user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [memRes, admRes, studentRes, parentRes, teacherRes] = await Promise.all([
        supabase.from("memberships").select("id, role, institution_id").eq("user_id", user.id),
        supabase.from("platform_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
        supabase.from("students").select("id").eq("linked_user_id", user.id).limit(1),
        supabase.from("parent_student_links").select("id").eq("parent_user_id", user.id).limit(1),
        supabase.from("memberships").select("id").eq("user_id", user.id).eq("role", "teacher").limit(1),
      ]);

      const memberships = memRes.data ?? [];
      const uniqueInsts = new Set(memberships.map((m: any) => m.institution_id));

      setStats({
        institutions: uniqueInsts.size,
        isPlatformAdmin: !!admRes.data,
        isStudent: (studentRes.data?.length ?? 0) > 0,
        isParent: (parentRes.data?.length ?? 0) > 0,
        isTeacher: (teacherRes.data?.length ?? 0) > 0,
      });
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

  const portals = [
    {
      key: "dashboard",
      href: "/dashboard",
      emoji: "🎛️",
      title: "Admin Dashboard",
      bn: "প্রশাসনিক ড্যাশবোর্ড",
      desc: "আপনার সব প্রতিষ্ঠান পরিচালনা করুন",
      show: true,
      color: "#10b981",
    },
    {
      key: "student",
      href: "/student",
      emoji: "🎓",
      title: "Student Portal",
      bn: "শিক্ষার্থী পোর্টাল",
      desc: "পরীক্ষা, ফলাফল, রুটিন",
      show: stats.isStudent,
      color: "#06b6d4",
    },
    {
      key: "teacher",
      href: "/teacher",
      emoji: "👨‍🏫",
      title: "Teacher Portal",
      bn: "শিক্ষক পোর্টাল",
      desc: "ক্লাস, ছাত্র, অ্যাসাইনমেন্ট",
      show: stats.isTeacher,
      color: "#8b5cf6",
    },
    {
      key: "parent",
      href: "/parent",
      emoji: "👪",
      title: "Parent Portal",
      bn: "অভিভাবক পোর্টাল",
      desc: "সন্তানের অগ্রগতি, ফলাফল, ফি",
      show: stats.isParent,
      color: "#14b8a6",
    },
    {
      key: "super-admin",
      href: "/super-admin",
      emoji: "👑",
      title: "Super Admin",
      bn: "প্ল্যাটফর্ম কনসোল",
      desc: "পুরো SKB নিয়ন্ত্রণ",
      show: stats.isPlatformAdmin,
      color: "#f59e0b",
    },
    {
      key: "admin-requests",
      href: "/super-admin/requests",
      emoji: "📥",
      title: "Institution Requests",
      bn: "নতুন প্রতিষ্ঠান অনুরোধ",
      desc: "নতুন প্রতিষ্ঠান যাচাই করুন",
      show: stats.isPlatformAdmin,
      color: "#ec4899",
    },
    {
      key: "pricing",
      href: "/pricing",
      emoji: "💰",
      title: "Pricing & Plans",
      bn: "সাবস্ক্রিপশন প্ল্যান",
      desc: "প্ল্যান দেখুন ও আপগ্রেড করুন",
      show: true,
      color: "#f43f5e",
    },
    {
      key: "profile",
      href: "/profile",
      emoji: "👤",
      title: "My Profile",
      bn: "আমার প্রোফাইল",
      desc: "নাম, ফোন, ছবি পরিবর্তন করুন",
      show: true,
      color: "#06b6d4",
    },
  ];

  const visiblePortals = portals.filter((p) => p.show);
  const firstName = (user?.email || "User").split("@")[0];

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 border-b"
        style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
          <Link href="/hub" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-[13px] shadow-lg">
              SKB
            </div>
            <div className="leading-tight">
              <div className="text-[14px] font-semibold">SKB Hub</div>
              <div className="bangla text-[11px]" style={{ color: "var(--text-muted)" }}>সব পোর্টাল এক জায়গায়</div>
            </div>
          </Link>
          <button onClick={signOut} className="rounded-full border px-3.5 py-1.5 text-[12px]"
            style={{ borderColor: "var(--border)" }}>
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 md:px-8 pt-8">
        {/* Welcome */}
        <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-6 md:p-8 text-white relative overflow-hidden">
          <div className="pointer-events-none absolute -right-20 -top-20 h-[220px] w-[220px] rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-[200px] w-[200px] rounded-full bg-teal-300/20 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[12px] backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-200 animate-pulse" />
              আপনার ওয়ার্কস্পেস
            </div>
            <h1 className="mt-4 text-[26px] md:text-[32px] font-semibold leading-tight">
              স্বাগতম, {firstName}!
            </h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-emerald-50/90">
              আপনার account-এ {visiblePortals.length}টি portal আছে। নিচের card থেকে যেকোনো জায়গায় যান।
            </p>
          </div>
        </div>

        {/* Portals grid */}
        <div className="mt-8">
          <h2 className="text-[16px] font-semibold mb-4">
            Your Portals · <span className="bangla font-normal">আপনার পোর্টাল</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visiblePortals.map((p) => (
              <Link key={p.key} href={p.href}
                className="group relative overflow-hidden rounded-2xl border p-5 transition hover:-translate-y-1 hover:shadow-xl"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <div className="absolute top-0 inset-x-0 h-1" style={{ background: p.color }} />
                <div className="flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-[28px]"
                    style={{ background: p.color + "20" }}>
                    {p.emoji}
                  </div>
                  <span className="text-[16px] opacity-30 group-hover:opacity-100 transition"
                    style={{ color: p.color }}>→</span>
                </div>
                <div className="mt-4">
                  <div className="text-[16px] font-semibold">{p.title}</div>
                  <div className="bangla text-[13px]" style={{ color: "var(--text-muted)" }}>{p.bn}</div>
                  <div className="mt-2 text-[12px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{p.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div className="mt-10">
          <h2 className="text-[16px] font-semibold mb-4">
            Quick Actions · <span className="bangla font-normal">দ্রুত কাজ</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <QuickLink href="/institutions/new" emoji="🏛️" label="New Institution" bn="নতুন প্রতিষ্ঠান" />
            <QuickLink href="/dashboard" emoji="📋" label="My Institutions" bn="আমার প্রতিষ্ঠান" />
            <QuickLink href="/pricing" emoji="💰" label="Pricing" bn="মূল্য" />
            <QuickLink href="/" emoji="🌐" label="Public Site" bn="পাবলিক সাইট" />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-10 rounded-2xl border p-5"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <h3 className="text-[13px] font-semibold mb-3">
            Your Stats · <span className="bangla font-normal">আপনার হিসাব</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatBox icon="🏛️" value={stats.institutions} label="Institutions" bn="প্রতিষ্ঠান" />
            <StatBox icon="🎓" value={stats.isStudent ? "✓" : "—"} label="Student Access" bn="শিক্ষার্থী" />
            <StatBox icon="👨‍🏫" value={stats.isTeacher ? "✓" : "—"} label="Teacher Access" bn="শিক্ষক" />
            <StatBox icon="👑" value={stats.isPlatformAdmin ? "✓" : "—"} label="Platform Admin" bn="মালিকানা" />
          </div>
        </div>

        <div className="mt-10 text-center text-[11px]" style={{ color: "var(--text-faint)" }}>
          © 2025 SKB Education Ecosystem · Hub
        </div>
      </div>
    </main>
  );
}

function QuickLink({ href, emoji, label, bn }: { href: string; emoji: string; label: string; bn: string }) {
  return (
    <Link href={href}
      className="rounded-xl border p-4 text-center transition hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
      <div className="text-[24px]">{emoji}</div>
      <div className="mt-2 text-[12px] font-medium">{label}</div>
      <div className="bangla text-[10px]" style={{ color: "var(--text-faint)" }}>{bn}</div>
    </Link>
  );
}

function StatBox({ icon, value, label, bn }: { icon: string; value: any; label: string; bn: string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: "var(--bg-soft)" }}>
      <div className="text-[18px]">{icon}</div>
      <div className="mt-1 text-[18px] font-bold">{value}</div>
      <div className="text-[10px] font-medium uppercase" style={{ color: "var(--text-muted)" }}>{label}</div>
      <div className="bangla text-[10px]" style={{ color: "var(--text-faint)" }}>{bn}</div>
    </div>
  );
}
