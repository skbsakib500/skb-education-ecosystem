"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

const TOPICS = ["general","physics","chemistry","biology","math","english","ict","career","exam"];

export default function DiscussionsPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState<string>("");
  const [sort, setSort] = useState<"hot"|"new"|"top">("hot");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login/");
  }, [user, authLoading, router]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.rpc("get_discussions", { p_topic: topic || null, p_sort: sort, p_limit: 30 });
    setItems(data ?? []);
    setLoading(false);
  };
  useEffect(() => { if (user) load(); }, [user, topic, sort]);

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 border-b" style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link href="/hub" className="text-[13px]" style={{ color: "var(--text-muted)" }}>← Hub</Link>
          <div className="flex gap-2">
            <Link href="/discussions/new" className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-1.5 text-fluid-caption font-semibold text-white shadow">+ Ask</Link>
            <button onClick={signOut} className="rounded-full border px-3 py-1.5 text-fluid-caption" style={{ borderColor: "var(--border)" }}>Sign out</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-6">
        <div className="rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-6 text-white">
          <h1 className="text-[24px] font-semibold">💡 Discussions</h1>
          <p className="text-[13px] mt-1 text-white/90">প্রশ্ন করুন, উত্তর দিন, শেখান-শিখুন</p>
        </div>

        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <select value={topic} onChange={(e) => setTopic(e.target.value)}
            className="rounded-full border px-3 py-1.5 text-fluid-caption outline-none"
            style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            <option value="">All topics</option>
            {TOPICS.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
          </select>
          <div className="flex gap-1 rounded-full border p-1 text-fluid-micro" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            {(["hot","new","top"] as const).map((s) => (
              <button key={s} onClick={() => setSort(s)}
                className={"rounded-full px-3 py-1 font-medium capitalize " + (sort === s ? "bg-[var(--text)] text-[var(--bg)]" : "")}
                style={sort !== s ? { color: "var(--text-muted)" } : {}}>{s}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>
        ) : items.length === 0 ? (
          <div className="mt-6 rounded-2xl border p-12 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            <div className="text-[48px]">💡</div>
            <div className="mt-3 text-[15px] font-semibold">No discussions yet</div>
            <div className="bangla text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>প্রথম প্রশ্ন করুন</div>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {items.map((d) => (
              <Link key={d.id} href={"/discussions/view/?id=" + d.id}
                className="block rounded-2xl border p-4 hover:shadow-md transition"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <div className="flex items-start gap-3">
                  <div className="shrink-0 text-center">
                    <div className="text-[18px] font-bold text-emerald-700">{d.upvotes}</div>
                    <div className="text-[9px] uppercase" style={{ color: "var(--text-muted)" }}>votes</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-[15px] font-semibold line-clamp-2">{d.title}</div>
                      {d.is_answered && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-fluid-micro font-semibold text-emerald-700">✓ Answered</span>}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2 text-fluid-micro" style={{ color: "var(--text-muted)" }}>
                      {d.topic && <span className="rounded-full bg-[var(--bg-soft)] px-2 py-0.5 capitalize">{d.topic}</span>}
                      <span>💬 {d.answers_count} answers</span>
                      <span>👁 {d.views}</span>
                      <span>by {d.author_name || "Anonymous"}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
