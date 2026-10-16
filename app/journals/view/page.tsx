"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export default function Page() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>}><JournalView /></Suspense>;
}

function JournalView() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");

  const [journal, setJournal] = useState<any>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [aForm, setAForm] = useState({ title: "", abstract: "", content: "" });
  const [saving, setA] = useState(false);

  const load = async () => {
    if (!slug) return;
    const [j, a, f] = await Promise.all([
      supabase.from("journals").select("*, profiles:owner_id(full_name, username, avatar_url)").eq("slug", slug).maybeSingle(),
      supabase.from("journal_articles").select("*, profiles:author_id(full_name, username, avatar_url)").eq("status", "published").order("published_at", { ascending: false }),
      user ? supabase.from("journal_followers").select("journal_id").eq("user_id", user.id) : Promise.resolve({ data: [] }),
    ]);
    setJournal(j.data);
    if (j.data) {
      const { data: arts } = await supabase.from("journal_articles")
        .select("*, profiles:author_id(full_name, username, avatar_url)")
        .eq("journal_id", j.data.id).eq("status", "published")
        .order("published_at", { ascending: false });
      setArticles(arts ?? []);
      const isF = ((f as any).data ?? []).some((x: any) => x.journal_id === j.data.id);
      setFollowing(isF);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login/"); return; }
    if (user && slug) load();
  }, [user, slug, authLoading, router]);

  const toggleFollow = async () => {
    if (!user || !journal) return;
    if (following) {
      await supabase.from("journal_followers").delete().eq("journal_id", journal.id).eq("user_id", user.id);
      setFollowing(false);
    } else {
      await supabase.from("journal_followers").insert({ journal_id: journal.id, user_id: user.id });
      setFollowing(true);
    }
  };

  const submitArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !journal) return;
    setA(true);
    const { error } = await supabase.from("journal_articles").insert({
      journal_id: journal.id, author_id: user.id,
      title: aForm.title.trim(), abstract: aForm.abstract.trim() || null, content: aForm.content.trim() || null,
    });
    setA(false);
    if (error) { alert(error.message); return; }
    setAForm({ title: "", abstract: "", content: "" });
    setShowArticleForm(false);
    await load();
  };

  if (authLoading || loading || !journal) {
    return <div className="min-h-screen flex items-center justify-center"><div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>;
  }

  const isOwner = user?.id === journal.owner_id;

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 border-b" style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link href="/journals" className="text-[13px]" style={{ color: "var(--text-muted)" }}>← Journals</Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-6 space-y-5">
        <div className="rounded-3xl border p-6" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="text-[26px] font-semibold">📔 {journal.name}</div>
              <div className="text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>
                by {journal.profiles?.full_name || "Anonymous"} · <span className="capitalize">{journal.category}</span>
              </div>
              {journal.description && <p className="text-[13px] mt-3">{journal.description}</p>}
              <div className="mt-3 flex gap-3 text-[12px]" style={{ color: "var(--text-muted)" }}>
                <span>📄 {journal.articles_count} articles</span>
                <span>👥 {journal.followers_count} followers</span>
              </div>
            </div>
            {!isOwner && (
              <button onClick={toggleFollow}
                className={"rounded-full px-5 py-2 text-[13px] font-semibold shadow " + (following ? "border" : "bg-gradient-to-br from-emerald-500 to-teal-600 text-white")}
                style={following ? { borderColor: "var(--border)" } : {}}>
                {following ? "✓ Following" : "+ Follow"}
              </button>
            )}
          </div>
        </div>

        {isOwner && (
          <>
            <button onClick={() => setShowArticleForm(!showArticleForm)}
              className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-2 text-[13px] font-semibold text-white shadow">
              {showArticleForm ? "Cancel" : "+ New Article"}
            </button>
            {showArticleForm && (
              <form onSubmit={submitArticle} className="rounded-2xl border p-5 space-y-3" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <input type="text" required value={aForm.title} onChange={(e) => setAForm({ ...aForm, title: e.target.value })}
                  placeholder="Article title"
                  className="w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
                <textarea value={aForm.abstract} onChange={(e) => setAForm({ ...aForm, abstract: e.target.value })}
                  rows={2} placeholder="Abstract..."
                  className="w-full rounded-xl border px-3.5 py-2.5 text-[13px] outline-none resize-none"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
                <textarea value={aForm.content} onChange={(e) => setAForm({ ...aForm, content: e.target.value })}
                  rows={6} placeholder="Full content..."
                  className="w-full rounded-xl border px-3.5 py-2.5 text-[13px] outline-none resize-none"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
                <button type="submit" disabled={saving || !aForm.title.trim()}
                  className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-2 text-[13px] font-semibold text-white disabled:opacity-50">
                  {saving ? "Publishing..." : "Publish Article"}
                </button>
              </form>
            )}
          </>
        )}

        <div>
          <h2 className="text-[16px] font-semibold mb-3">📄 Articles ({articles.length})</h2>
          {articles.length === 0 ? (
            <div className="rounded-2xl border p-8 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <div className="text-[36px]">📄</div>
              <div className="mt-2 text-[13px]" style={{ color: "var(--text-muted)" }}>No articles yet</div>
            </div>
          ) : (
            <div className="space-y-3">
              {articles.map((a) => (
                <div key={a.id} className="rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                  <div className="text-[16px] font-semibold">{a.title}</div>
                  <div className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
                    by {a.profiles?.full_name || "Anonymous"} · {new Date(a.published_at).toLocaleDateString()}
                  </div>
                  {a.abstract && <p className="text-[13px] mt-3 leading-relaxed" style={{ color: "var(--text-muted)" }}>{a.abstract}</p>}
                  {a.content && <p className="text-[13px] mt-3 leading-relaxed whitespace-pre-wrap">{a.content}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
