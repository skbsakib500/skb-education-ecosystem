"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export default function Page() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>}><DiscussionView /></Suspense>;
}

function DiscussionView() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [disc, setDisc] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [answerText, setAnswerText] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!id) return;
    const [d, a] = await Promise.all([
      supabase.from("discussions").select("*, profiles:author_id(full_name, username, avatar_url, headline)").eq("id", id).maybeSingle(),
      supabase.from("discussion_answers").select("*, profiles:author_id(full_name, username, avatar_url, headline)").eq("discussion_id", id).order("is_best", { ascending: false }).order("upvotes", { ascending: false }),
    ]);
    setDisc(d.data);
    setAnswers(a.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login/"); return; }
    if (user && id) load();
  }, [user, id, authLoading, router]);

  const submitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !answerText.trim()) return;
    setSaving(true);
    await supabase.from("discussion_answers").insert({
      discussion_id: id, author_id: user.id, body: answerText.trim(),
    });
    setAnswerText(""); setSaving(false);
    await load();
  };

  const vote = async (answerId: string | null) => {
    if (!user) return;
    await supabase.from("discussion_votes").insert({
      user_id: user.id,
      discussion_id: answerId ? null : id,
      answer_id: answerId,
      vote: 1,
    });
    await load();
  };

  const markBest = async (answerId: string) => {
    const { error } = await supabase.rpc("mark_best_answer", { p_answer_id: answerId });
    if (error) { alert(error.message); return; }
    await load();
  };

  if (authLoading || loading || !disc) {
    return <div className="min-h-screen flex items-center justify-center"><div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>;
  }

  const isAuthor = user?.id === disc.author_id;

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 border-b" style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link href="/discussions" className="text-[13px]" style={{ color: "var(--text-muted)" }}>← Discussions</Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-6 space-y-4">
        {/* Question */}
        <div className="rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="flex items-start gap-4">
            <button onClick={() => vote(null)} className="shrink-0 text-center rounded-xl px-3 py-2 hover:bg-emerald-500/10 transition">
              <div className="text-[18px]">▲</div>
              <div className="text-[16px] font-bold text-emerald-700">{disc.upvotes}</div>
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {disc.topic && <span className="rounded-full bg-[var(--bg-soft)] px-2 py-0.5 text-fluid-micro capitalize">{disc.topic}</span>}
                {disc.is_answered && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-fluid-micro font-semibold text-emerald-700">✓ Answered</span>}
              </div>
              <h1 className="mt-2 text-[22px] font-semibold leading-tight">{disc.title}</h1>
              {disc.body && <p className="mt-3 text-[14px] leading-relaxed whitespace-pre-wrap">{disc.body}</p>}
              <div className="mt-3 text-fluid-micro" style={{ color: "var(--text-muted)" }}>
                Asked by <Link href={"/u/?username=" + (disc.profiles?.username || "")} className="font-medium hover:text-emerald-600">{disc.profiles?.full_name || "Anonymous"}</Link>
                {" · "}{new Date(disc.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Answer form */}
        <form onSubmit={submitAnswer} className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <label className="text-fluid-caption font-medium" style={{ color: "var(--text-muted)" }}>Your Answer</label>
          <textarea value={answerText} onChange={(e) => setAnswerText(e.target.value)}
            rows={4} placeholder="উত্তর লিখুন..."
            className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none resize-none"
            style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
          <button type="submit" disabled={saving || !answerText.trim()}
            className="mt-3 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-2 text-[13px] font-semibold text-white shadow disabled:opacity-50">
            {saving ? "Posting..." : "Post Answer →"}
          </button>
        </form>

        {/* Answers */}
        <div className="space-y-3">
          <div className="text-[14px] font-semibold">
            {answers.length} Answer{answers.length !== 1 ? "s" : ""}
          </div>
          {answers.map((a) => (
            <div key={a.id} className={"rounded-2xl border p-5 " + (a.is_best ? "border-emerald-500/40 bg-emerald-500/5" : "")}
              style={!a.is_best ? { borderColor: "var(--border)", background: "var(--surface-3)" } : {}}>
              {a.is_best && (
                <div className="mb-2 text-fluid-micro font-bold text-emerald-700">✓ BEST ANSWER</div>
              )}
              <div className="flex items-start gap-4">
                <button onClick={() => vote(a.id)} className="shrink-0 text-center rounded-xl px-3 py-2 hover:bg-emerald-500/10 transition">
                  <div className="text-[18px]">▲</div>
                  <div className="text-[14px] font-bold text-emerald-700">{a.upvotes}</div>
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{a.body}</p>
                  <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-fluid-micro" style={{ color: "var(--text-muted)" }}>
                      by <Link href={"/u/?username=" + (a.profiles?.username || "")} className="font-medium hover:text-emerald-600">{a.profiles?.full_name || "Anonymous"}</Link>
                      {" · "}{new Date(a.created_at).toLocaleDateString()}
                    </div>
                    {isAuthor && !a.is_best && (
                      <button onClick={() => markBest(a.id)}
                        className="rounded-full border px-3 py-1 text-fluid-micro font-medium"
                        style={{ borderColor: "var(--border)" }}>
                        ✓ Mark as Best
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
