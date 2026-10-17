"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import Feed from "@/components/social/Feed";
import NotificationCenter from "@/components/NotificationCenter";
import { Button } from "@/components/ui";

export default function FeedPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login/");
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-16 bg-canvas">
      <header
        className="sticky top-0 z-30 border-b bg-surface"
        style={{ borderColor: "var(--color-border)", backdropFilter: "blur(24px)" }}
      >
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <Link href="/feed/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-fluid-body-sm shadow-elevation-1">
              SKB
            </div>
            <div className="leading-tight">
              <div className="text-fluid-body-sm font-semibold text-fg">Feed</div>
              <div className="bangla text-fluid-micro text-fg-muted">আপনার নিউজফিড</div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/explore/" className="hidden sm:block">
              <Button size="sm" variant="outline">
                🔍 Explore
              </Button>
            </Link>
            <Link href="/hub/" className="hidden sm:block">
              <Button size="sm" variant="outline">
                🏠 Hub
              </Button>
            </Link>

            <NotificationCenter />

            <Button size="sm" variant="outline" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 pt-6">
        <Feed />
        <div className="mt-10 text-center text-fluid-caption text-fg-subtle">
          © {new Date().getFullYear()} SKB Education Ecosystem · Social Layer
        </div>
      </div>
    </main>
  );
}
