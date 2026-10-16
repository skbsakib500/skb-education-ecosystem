"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const CATEGORIES = [
  { value: "general", label: "General", emoji: "📌" },
  { value: "exam", label: "Exam", emoji: "📝" },
  { value: "holiday", label: "Holiday", emoji: "🎉" },
  { value: "urgent", label: "Urgent", emoji: "🚨" },
  { value: "event", label: "Event", emoji: "🎪" },
];
const AUDIENCES = [
  { value: "all", label: "Everyone" },
  { value: "teachers", label: "Teachers" },
  { value: "students", label: "Students" },
  { value: "parents", label: "Parents" },
];

export default function NoticesTab({ institutionId, isAdmin }: { institutionId: string; isAdmin: boolean }) {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", category: "general", audience: "all", is_pinned: false });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("notices").select("*").eq("institution_id", institutionId)
      .order("is_pinned", { ascending: false })
      .order("published_at", { ascending: false });
    setNotices(data ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, [institutionId]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true); setErr("");
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("notices").insert({
      institution_id: institutionId, title: form.title.trim(),
      content: form.content.trim() || null,
      category: form.category, audience: form.audience,
      is_pinned: form.is_pinned, created_by: u?.user?.id,
    });
    if (error) { setErr(error.message); setSaving(false); return; }
    setForm({ title: "", content: "", category: "general", audience: "all", is_pinned: false });
    setShowForm(false); setSaving(false); await load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete notice?")) return;
    await supabase.from("notices").delete().eq("id", id); await load();
  };

  const togglePin = async (id: string, current: boolean) => {
    await supabase.from("notices").update({ is_pinned: !current }).eq("id", id); await load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[16px] font-semibold">Notices · <span className="bangla font-normal">নোটিশ</span></h2>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)}
            className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow">
            {showForm ? "Cancel" : "+ New Notice"}
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <form onSubmit={create} className="mb-4 rounded-2xl border p-4 space-y-3"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div>
            <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Title *</label>
            <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Annual Sports Day"
              className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
          </div>
          <div>
            <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Content</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={3} placeholder="বিস্তারিত..."
              className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none resize-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Audience</label>
              <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-[12px]">
            <input type="checkbox" checked={form.is_pinned}
              onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })}
              className="h-4 w-4 accent-emerald-500" />
            📌 Pin to top
          </label>
          {err && <div className="text-[12px] text-rose-600">{err}</div>}
          <button type="submit" disabled={saving}
            className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-2 text-[13px] font-semibold text-white disabled:opacity-50">
            {saving ? "Publishing..." : "Publish"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-10 text-[13px]" style={{ color: "var(--text-muted)" }}>Loading...</div>
      ) : notices.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="text-[36px]">📢</div>
          <div className="mt-2 text-[14px] font-semibold">No notices yet</div>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map((n) => {
            const cat = CATEGORIES.find((c) => c.value === n.category);
            const aud = AUDIENCES.find((a) => a.value === n.audience);
            return (
              <div key={n.id} className="rounded-2xl border p-4"
                style={{
                  borderColor: n.is_pinned ? "rgba(16,185,129,0.4)" : "var(--border)",
                  background: n.is_pinned ? "rgba(16,185,129,0.03)" : "var(--surface-3)",
                }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {n.is_pinned && <span className="text-[14px]">📌</span>}
                      <span className="rounded-full bg-[var(--bg-soft)] px-2 py-0.5 text-[10px] font-medium">{cat?.emoji} {cat?.label}</span>
                      <span className="rounded-full bg-[var(--bg-soft)] px-2 py-0.5 text-[10px] font-medium">👥 {aud?.label}</span>
                    </div>
                    <div className="text-[14px] font-semibold">{n.title}</div>
                    {n.content && <p className="mt-1 text-[12px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{n.content}</p>}
                    <div className="mt-2 text-[10px]" style={{ color: "var(--text-faint)" }}>
                      {new Date(n.published_at).toLocaleString()}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="shrink-0 flex flex-col gap-1">
                      <button onClick={() => togglePin(n.id, n.is_pinned)}
                        className="rounded-full px-2 py-1 text-[11px] hover:bg-[var(--bg-soft)]">
                        {n.is_pinned ? "Unpin" : "Pin"}
                      </button>
                      <button onClick={() => remove(n.id)}
                        className="rounded-full px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-500/10">Delete</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
