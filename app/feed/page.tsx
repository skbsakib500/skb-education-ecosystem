"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import Feed from "@/components/social/Feed";
import NotificationCenter from "@/components/NotificationCenter";

export default function FeedPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login/");
  }, [user, loading, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>;
  }

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 border-b"
        style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link href="/feed" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-[13px] shadow-lg">SKB</div>
            <div className="leading-tight">
              <div className="text-[14px] font-semibold">Feed</div>
              <div className="bangla text-[11px]" style={{ color: "var(--text-muted)" }}>আপনার নিউজফিড</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/explore" className="hidden sm:flex rounded-full border px-3 py-1.5 text-[12px]" style={{ borderColor: "var(--border)" }}>🔍 Explore</Link>
            <Link href="/hub" className="hidden sm:flex rounded-full border px-3 py-1.5 text-[12px]" style={{ borderColor: "var(--border)" }}>🏠 Hub</Link>
            <NotificationCenter />
            <button onClick={signOut} className="rounded-full border px-3 py-1.5 text-[12px]" style={{ borderColor: "var(--border)" }}>Sign out</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-6">
        <Feed />
        <div className="mt-10 text-center text-[11px]" style={{ color: "var(--text-faint)" }}>
          © 2025 SKB Education Ecosystem · Social Layer
        </div>
      </div>
    </main>
  );
}
