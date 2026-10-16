"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

const CATS = ["general","research","student","faculty","literary","science","arts"];

export default function NewJournalPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", slug: "", description: "", category: "general", is_public: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 40);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true); setError("");
    const slug = form.slug || slugify(form.name);
    const { data, error } = await supabase.from("journals").insert({
      owner_id: user.id, name: form.name.trim(), slug,
      description: form.description.trim() || null,
      category: form.category, is_public: form.is_public,
    }).select().single();
    setSaving(false);
    if (error) { setError(error.message); return; }
    router.push("/journals/view/?slug=" + data.slug);
  };

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/journals" className="text-[13px]" style={{ color: "var(--text-muted)" }}>← Journals</Link>
        <div className="mt-4 rounded-3xl border p-6 md:p-8" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <h1 className="text-[22px] font-semibold">📔 Create Journal</h1>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Journal Name *</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })}
                placeholder="SKB Physics Research"
                className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>URL slug</label>
              <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                placeholder="skb-physics-research"
                className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none font-mono"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                {CATS.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3} placeholder="এই journal সম্পর্কে..."
                className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none resize-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>
            <label className="flex items-center gap-2 text-[13px]">
              <input type="checkbox" checked={form.is_public} onChange={(e) => setForm({ ...form, is_public: e.target.checked })} className="accent-emerald-500" />
              🌐 Public (everyone can see)
            </label>
            {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-[12px] text-rose-700">{error}</div>}
            <button type="submit" disabled={saving}
              className="w-full rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 py-3 text-[14px] font-semibold text-white shadow disabled:opacity-50">
              {saving ? "Creating..." : "Create Journal →"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
