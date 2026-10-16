"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export default function ExplorePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [trending, setTrending] = useState<any[]>([]);
  const [suggested, setSuggested] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [t, s] = await Promise.all([
        supabase.rpc("get_trending_posts", { p_limit: 10 }),
        supabase.rpc("get_suggested_follows", { p_limit: 12 }),
      ]);
      setTrending(t.data ?? []);
      setSuggested(s.data ?? []);
      setLoading(false);
    })();
  }, [user]);

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>;
  }

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 border-b"
        style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/feed" className="text-[13px]" style={{ color: "var(--text-muted)" }}>← Feed</Link>
          <div className="text-[14px] font-semibold">🔍 Explore</div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pt-6 space-y-6">
        {/* Trending */}
        <section>
          <h2 className="text-[16px] font-semibold mb-3">🔥 Trending Now</h2>
          {trending.length === 0 ? (
            <div className="rounded-2xl border p-8 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <div className="text-[36px]">🔥</div>
              <div className="mt-2 text-[13px]" style={{ color: "var(--text-muted)" }}>No trending posts yet</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {trending.map((t) => (
                <div key={t.id} className="rounded-2xl border p-4 hover:shadow-md transition"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ background: "linear-gradient(135deg,#10b981,#14b8a6)" }}>
                      {t.author_avatar ? <img src={t.author_avatar} alt="" className="h-full w-full object-cover rounded-full" /> : (t.author_name || "U").slice(0, 1)}
                    </div>
                    <span className="text-[12px] font-semibold">{t.author_name}</span>
                    <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                      {t.likes_count}❤️ · {t.comments_count}💬
                    </span>
                  </div>
                  <p className="text-[13px] leading-relaxed line-clamp-3">{t.content}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Suggested Users */}
        <section>
          <h2 className="text-[16px] font-semibold mb-3">👥 People You May Know</h2>
          {suggested.length === 0 ? (
            <div className="rounded-2xl border p-8 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <div className="text-[13px]" style={{ color: "var(--text-muted)" }}>No suggestions yet</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {suggested.map((s) => {
                const init = (s.full_name || "U").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <Link key={s.user_id} href={"/u/?username=" + s.username}
                    className="rounded-2xl border p-4 text-center hover:-translate-y-0.5 hover:shadow-md transition"
                    style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-[20px] font-bold text-white"
                      style={{ background: "linear-gradient(135deg,#10b981,#14b8a6)" }}>
                      {s.avatar_url ? <img src={s.avatar_url} alt="" className="h-full w-full object-cover rounded-full" /> : init}
                    </div>
                    <div className="mt-3 text-[13px] font-semibold truncate">{s.full_name}</div>
                    <div className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>@{s.username}</div>
                    {s.headline && <div className="text-[10px] truncate mt-0.5" style={{ color: "var(--text-faint)" }}>{s.headline}</div>}
                    <div className="mt-2 text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
                      {s.followers_count} followers
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
