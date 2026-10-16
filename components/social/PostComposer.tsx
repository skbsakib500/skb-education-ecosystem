"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

const POST_TYPES: Array<{ value: string; label: string; bn: string; emoji: string }> = [
  { value: "text",         label: "Post",         bn: "পোস্ট",      emoji: "💬" },
  { value: "question",     label: "Question",     bn: "প্রশ্ন",     emoji: "❓" },
  { value: "announcement", label: "Announcement", bn: "ঘোষণা",     emoji: "📢" },
  { value: "journal",      label: "Journal",      bn: "জার্নাল",    emoji: "📔" },
  { value: "achievement",  label: "Achievement",  bn: "অর্জন",     emoji: "🏆" },
  { value: "resource",     label: "Resource",     bn: "রিসোর্স",   emoji: "📚" },
];

export default function PostComposer({ onPosted }: { onPosted?: () => void }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [type, setType] = useState("text");
  const [visibility, setVisibility] = useState("public");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true); setErr("");

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) { setErr("Please sign in"); setSaving(false); return; }

    const { data: mem } = await supabase.from("memberships").select("institution_id")
      .eq("user_id", user.user.id).limit(1).maybeSingle();

    const { error } = await supabase.from("social_posts").insert({
      user_id: user.user.id,
      content: content.trim(),
      post_type: type,
      visibility,
      institution_id: mem?.institution_id ?? null,
    });

    setSaving(false);
    if (error) { setErr(error.message); return; }
    setContent(""); setType("text"); setOpen(false);
    onPosted?.();
  };

  const currentType = POST_TYPES.find((t) => t.value === type) ?? POST_TYPES[0];

  return (
    <div className="rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
      <form onSubmit={submit} className="p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setOpen(true)}
          rows={open ? 4 : 2}
          placeholder="আপনার মনের কথা, প্রশ্ন, বা অর্জন শেয়ার করুন..."
          className="w-full resize-none rounded-xl border px-4 py-3 text-[14px] outline-none"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}
        />

        {open && (
          <>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {POST_TYPES.map((t) => (
                <button key={t.value} type="button" onClick={() => setType(t.value)}
                  className={"rounded-full border px-3 py-1.5 text-[11px] font-medium transition " + (type === t.value ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700" : "")}
                  style={type !== t.value ? { borderColor: "var(--border)" } : {}}>
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-3 flex-wrap">
              <select value={visibility} onChange={(e) => setVisibility(e.target.value)}
                className="rounded-full border px-3 py-1 text-[11px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <option value="public">🌐 Everyone</option>
                <option value="followers">👥 Followers</option>
                <option value="institution">🏛️ My Institution</option>
              </select>
              <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
                {content.length}/2000
              </span>
            </div>

            {err && <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2 text-[12px] text-rose-700">{err}</div>}

            <div className="mt-3 flex gap-2">
              <button type="submit" disabled={saving || !content.trim() || content.length > 2000}
                className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-2 text-[13px] font-semibold text-white shadow disabled:opacity-50">
                {saving ? "Posting..." : "Post →"}
              </button>
              <button type="button" onClick={() => { setOpen(false); setContent(""); }}
                className="rounded-full border px-4 py-2 text-[13px]"
                style={{ borderColor: "var(--border)" }}>
                Cancel
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
