"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export default function Page() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>}><AssignmentsStudent /></Suspense>;
}

function AssignmentsStudent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const openId = searchParams.get("id");

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    const { data } = await supabase.rpc("my_assignments");
    setItems(data ?? []);
    setLoading(false);
    if (openId) {
      const a = (data ?? []).find((x: any) => x.id === openId);
      if (a) setSelected(a);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login/"); return; }
    if (user) load();
  }, [user, authLoading, router]);

  const submit = async () => {
    if (!selected || !content.trim()) return;
    setSaving(true); setMsg("");
    const { data, error } = await supabase.rpc("submit_assignment", {
      p_assignment_id: selected.id, p_content: content.trim(),
    });
    setSaving(false);
    if (error) { setMsg("❌ " + error.message); return; }
    setMsg("✅ Submitted" + ((data as any).is_late ? " (late)" : ""));
    setContent("");
    await load();
    setTimeout(() => { setSelected(null); setMsg(""); }, 1500);
  };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>;

  const upcoming = items.filter((i) => i.submission_status === null);
  const submitted = items.filter((i) => i.submission_status !== null);

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 border-b"
        style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link href="/student" className="text-[13px]" style={{ color: "var(--text-muted)" }}>← Student</Link>
          <div className="text-[13px] font-semibold">📝 My Assignments</div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-6">
        {items.length === 0 ? (
          <div className="rounded-2xl border p-12 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            <div className="text-[48px]">📝</div>
            <div className="mt-3 text-[15px] font-semibold">No assignments yet</div>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div className="mb-6">
                <div className="text-fluid-caption font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
                  Pending ({upcoming.length})
                </div>
                <div className="space-y-2">
                  {upcoming.map((a) => {
                    const overdue = new Date(a.due_at) < new Date();
                    return (
                      <button key={a.id} onClick={() => setSelected(a)}
                        className="w-full rounded-2xl border p-4 text-left hover:shadow-md transition"
                        style={{ borderColor: overdue ? "rgba(244,63,94,0.4)" : "var(--border)", background: "var(--surface-3)" }}>
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="min-w-0 flex-1">
                            <div className="text-[14px] font-semibold">{a.title}</div>
                            <div className="text-fluid-micro mt-0.5" style={{ color: "var(--text-muted)" }}>
                              {a.teacher_name && <>{a.teacher_name} · </>}{a.institution_name}
                            </div>
                            <div className="text-fluid-micro mt-2" style={{ color: overdue ? "#f43f5e" : "var(--text-muted)" }}>
                              📅 Due {new Date(a.due_at).toLocaleString()}
                            </div>
                          </div>
                          <span className="rounded-full bg-amber-500/15 px-2 py-1 text-fluid-micro font-semibold text-amber-700">Pending</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {submitted.length > 0 && (
              <div>
                <div className="text-fluid-caption font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-faint)" }}>
                  Submitted ({submitted.length})
                </div>
                <div className="space-y-2">
                  {submitted.map((a) => (
                    <div key={a.id} className="rounded-2xl border p-4 opacity-80"
                      style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0 flex-1">
                          <div className="text-[14px] font-semibold">{a.title}</div>
                          <div className="text-fluid-micro mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {a.teacher_name && <>{a.teacher_name} · </>}{a.institution_name}
                          </div>
                          {a.marks_obtained !== null && (
                            <div className="text-fluid-caption mt-1 font-semibold text-emerald-700">
                              🎯 {a.marks_obtained}/{a.max_marks}
                            </div>
                          )}
                          {a.feedback && <div className="text-fluid-micro italic mt-1" style={{ color: "var(--text-muted)" }}>💬 {a.feedback}</div>}
                        </div>
                        <span className={"rounded-full px-2 py-1 text-fluid-micro font-semibold " +
                          (a.submission_status === "graded" ? "bg-emerald-500/15 text-emerald-700" : "bg-cyan-500/15 text-cyan-700")}>
                          {a.submission_status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur p-4 overflow-y-auto">
          <div className="w-full max-w-2xl my-8 rounded-3xl border shadow-2xl"
            style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="text-[16px] font-semibold">{selected.title}</div>
              <button onClick={() => { setSelected(null); setMsg(""); }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-soft)]">✕</button>
            </div>
            <div className="p-5">
              <div className="text-fluid-caption flex flex-wrap gap-3 mb-3" style={{ color: "var(--text-muted)" }}>
                <span>🎯 {selected.max_marks} marks</span>
                <span>📅 Due {new Date(selected.due_at).toLocaleString()}</span>
              </div>
              {selected.description && (
                <div className="rounded-xl p-3 text-[13px] mb-4" style={{ background: "var(--bg-soft)" }}>
                  {selected.description}
                </div>
              )}
              <label className="text-fluid-caption font-medium" style={{ color: "var(--text-muted)" }}>Your Answer</label>
              <textarea value={content} onChange={(e) => setContent(e.target.value)}
                rows={6} placeholder="Write your answer here..."
                className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none resize-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
              {msg && <div className="mt-3 text-[13px] font-medium">{msg}</div>}
              <button onClick={submit} disabled={saving || !content.trim()}
                className="mt-4 w-full rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 py-3 text-[14px] font-semibold text-white shadow disabled:opacity-50">
                {saving ? "Submitting..." : "📤 Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
