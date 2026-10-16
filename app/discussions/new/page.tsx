"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export default function NewDiscussionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [topic, setTopic] = useState("general");
  const [tagsInput, setTagsInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true); setError("");
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    const { data, error } = await supabase.from("discussions").insert({
      author_id: user.id, title: title.trim(), body: body.trim() || null, topic, tags,
    }).select().single();
    setSaving(false);
    if (error) { setError(error.message); return; }
    router.push("/discussions/view/?id=" + data.id);
  };

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/discussions" className="text-[13px]" style={{ color: "var(--text-muted)" }}>← Discussions</Link>
        <div className="mt-4 rounded-3xl border p-6 md:p-8" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <h1 className="text-[22px] font-semibold">💡 Ask a Question</h1>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Title *</label>
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="What's the SI unit of force?"
                className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Details</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)}
                rows={6} placeholder="বিস্তারিতভাবে প্রশ্ন লিখুন..."
                className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none resize-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Topic</label>
                <select value={topic} onChange={(e) => setTopic(e.target.value)}
                  className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[13px] outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                  {["general","physics","chemistry","biology","math","english","ict","career","exam"].map((t) => (
                    <option key={t} value={t} className="capitalize">{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Tags (comma-separated)</label>
                <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="newton, force, class-10"
                  className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[13px] outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
              </div>
            </div>
            {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-[12px] text-rose-700">{error}</div>}
            <button type="submit" disabled={saving || !title.trim()}
              className="w-full rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 py-3 text-[14px] font-semibold text-white shadow disabled:opacity-50">
              {saving ? "Posting..." : "Post Question →"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
