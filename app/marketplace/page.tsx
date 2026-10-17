"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function MarketplacePage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login/");
  }, [user, loading, router]);

  const cards = [
    { href: "/tutors", emoji: "🎓", title: "Find a Tutor", bn: "টিউটর খুঁজুন", desc: "Subject, level, location অনুযায়ী tutor", color: "#10b981" },
    { href: "/tutors/become", emoji: "💰", title: "Become a Tutor", bn: "টিউটর হোন", desc: "নিজের প্রোফাইল বানিয়ে আয় করুন", color: "#14b8a6" },
    { href: "/jobs", emoji: "💼", title: "Job Board", bn: "চাকরির বোর্ড", desc: "শিক্ষা প্রতিষ্ঠানে নতুন সুযোগ", color: "#8b5cf6" },
    { href: "/jobs/new", emoji: "📌", title: "Post a Job", bn: "চাকরি পোস্ট", desc: "শিক্ষক/কর্মী খুঁজুন", color: "#6366f1" },
    { href: "/discussions", emoji: "💡", title: "Discussions", bn: "আলোচনা", desc: "প্রশ্ন-উত্তর, Q&A", color: "#f59e0b" },
    { href: "/discussions/new", emoji: "❓", title: "Ask Question", bn: "প্রশ্ন করুন", desc: "সমস্যা জিজ্ঞাসা করুন", color: "#f97316" },
    { href: "/journals", emoji: "📔", title: "Journals", bn: "জার্নাল", desc: "গবেষণা, লেখা, প্রকাশনা", color: "#06b6d4" },
    { href: "/explore", emoji: "🔍", title: "Explore", bn: "আবিষ্কার", desc: "নতুন মানুষ, trending", color: "#ec4899" },
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>;

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 border-b" style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/hub" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-bold text-[13px] shadow-lg">🛒</div>
            <div className="leading-tight">
              <div className="text-[14px] font-semibold">Marketplace</div>
              <div className="bangla text-fluid-micro" style={{ color: "var(--text-muted)" }}>শিক্ষা মার্কেটপ্লেস</div>
            </div>
          </Link>
          <button onClick={signOut} className="rounded-full border px-3 py-1.5 text-fluid-caption" style={{ borderColor: "var(--border)" }}>Sign out</button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pt-6">
        <div className="rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-violet-700 p-6 md:p-8 text-white relative overflow-hidden">
          <div className="pointer-events-none absolute -right-20 -top-20 h-[220px] w-[220px] rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-fluid-caption backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-violet-200 animate-pulse" />
              Everything in One Place
            </div>
            <h1 className="mt-4 text-[26px] md:text-[32px] font-semibold">Education Marketplace</h1>
            <p className="mt-2 text-[14px] text-violet-50/90 max-w-2xl">
              Tutor, Job, Discussion, Journal — সব একসাথে। বিশ্বের সবচেয়ে বড় শিক্ষা ইকোসিস্টেম।
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <Link key={c.href} href={c.href}
              className="group rounded-2xl border p-5 transition hover:-translate-y-1 hover:shadow-lg"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-[26px]"
                style={{ background: c.color + "20" }}>
                {c.emoji}
              </div>
              <div className="mt-4">
                <div className="text-[15px] font-semibold">{c.title}</div>
                <div className="bangla text-[13px]" style={{ color: "var(--text-muted)" }}>{c.bn}</div>
                <div className="mt-2 text-fluid-micro" style={{ color: "var(--text-faint)" }}>{c.desc}</div>
              </div>
              <div className="mt-3 text-fluid-caption font-medium opacity-0 group-hover:opacity-100 transition" style={{ color: c.color }}>
                Open →
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center text-fluid-micro" style={{ color: "var(--text-faint)" }}>
          © 2025 SKB Education Ecosystem · Marketplace & Knowledge Hub
        </div>
      </div>
    </main>
  );
}
