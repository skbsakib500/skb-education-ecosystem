"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

const TYPES: Array<{ v: string; l: string; e: string }> = [
  { v: "pdf", l: "PDF", e: "📄" },
  { v: "video", l: "Video (YouTube link)", e: "🎥" },
  { v: "note", l: "Note", e: "📝" },
  { v: "link", l: "External Link", e: "🔗" },
  { v: "audio", l: "Audio", e: "🎵" },
  { v: "image", l: "Image", e: "🖼️" },
  { v: "doc", l: "Word Doc", e: "📃" },
  { v: "ppt", l: "PowerPoint", e: "📊" },
];
const SUBJECTS = ["Physics","Chemistry","Biology","Math","English","Bangla","ICT","Accounting","Economics","Arabic","Others"];

export default function UploadMaterialPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "", description: "", type: "pdf", subject: "",
    external_url: "", tags: "", is_public: true,
  });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);

  if (!authLoading && !user) { router.push("/login/"); }

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 25 * 1024 * 1024) { setError("Max 25 MB"); return; }
    setFile(f);
    setError("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const externalTypes = ["video", "audio", "link"];
    const isExternal = externalTypes.includes(form.type);
    if (isExternal && !form.external_url.trim()) {
      setError("YouTube / Drive / External URL দিন (video সরাসরি upload করা যাবে না)");
      return;
    }
    if (!isExternal && !file) {
      setError("File select করুন");
      return;
    }
    if (!isExternal && file && file.size > 5 * 1024 * 1024) {
      setError("File size max 5 MB (বড় ফাইল চাইলে Google Drive link ব্যবহার করুন)");
      return;
    }

    setSaving(true); setError(""); setProgress(0);

    let file_url: string | null = null;
    let file_size: number | null = null;

    if (file) {
      const ext = (file.name.split(".").pop() || "bin").toLowerCase();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("study-materials").upload(path, file, {
        contentType: file.type, upsert: false,
      });
      if (upErr) { setError(upErr.message); setSaving(false); return; }
      const { data } = supabase.storage.from("study-materials").getPublicUrl(path);
      file_url = data.publicUrl;
      file_size = file.size;
    }

    const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);

    const { data: mem } = await supabase.from("memberships").select("institution_id")
      .eq("user_id", user.id).limit(1).maybeSingle();

    const { error: insErr } = await supabase.from("study_materials").insert({
      uploader_id: user.id,
      institution_id: mem?.institution_id ?? null,
      class_id: null,
      subject: form.subject || null,
      title: form.title.trim(),
      description: form.description.trim() || null,
      type: form.type,
      file_url,
      file_size,
      external_url: ["video","audio","link"].includes(form.type) ? form.external_url.trim() : null,
      tags,
      is_public: form.is_public,
    });

    setSaving(false);
    if (insErr) { setError(insErr.message); return; }
    router.push("/materials/");
  };

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/materials" className="text-[13px]" style={{ color: "var(--text-muted)" }}>← Materials</Link>
        <div className="mt-4 rounded-3xl border p-6 md:p-8" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <h1 className="text-[22px] font-semibold">📚 Upload Material</h1>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="text-fluid-caption font-medium" style={{ color: "var(--text-muted)" }}>Type *</label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {TYPES.map((t) => (
                  <button key={t.v} type="button" onClick={() => setForm({ ...form, type: t.v })}
                    className={"rounded-xl border p-2 text-center " + (form.type === t.v ? "bg-emerald-500/15 border-emerald-500/40" : "")}
                    style={form.type !== t.v ? { borderColor: "var(--border)" } : {}}>
                    <div className="text-[18px]">{t.e}</div>
                    <div className="mt-0.5 text-fluid-micro font-medium">{t.l}</div>
                  </button>
                ))}
              </div>
            </div>

            <Field label="Title *" value={form.title} onChange={(v: string) => setForm({ ...form, title: v })} placeholder="Newton's Laws - Chapter 4" required />

            <div>
              <label className="text-fluid-caption font-medium" style={{ color: "var(--text-muted)" }}>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2} placeholder="বিস্তারিত..."
                className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[13px] outline-none resize-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-fluid-caption font-medium" style={{ color: "var(--text-muted)" }}>Subject</label>
                <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[13px] outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                  <option value="">None</option>
                  {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-fluid-caption font-medium" style={{ color: "var(--text-muted)" }}>Tags (comma-separated)</label>
                <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="class-10, hsc, mnemonic"
                  className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[13px] outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
              </div>
            </div>

            {form.type === "link" ? (
              <Field label="External URL *" value={form.external_url} onChange={(v: string) => setForm({ ...form, external_url: v })} placeholder="https://youtube.com/..." />
            ) : (
              <div>
                <label className="text-fluid-caption font-medium" style={{ color: "var(--text-muted)" }}>File * (max 25 MB)</label>
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp" onChange={onFile} className="hidden" />
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="mt-1 w-full rounded-xl border-2 border-dashed py-6 text-center transition hover:border-emerald-500/40"
                  style={{ borderColor: "var(--border-strong)", background: "var(--bg-soft)" }}>
                  <div className="text-[28px]">📁</div>
                  <div className="mt-1 text-[13px] font-medium">{file ? file.name : "Click to select file"}</div>
                  {file && <div className="text-fluid-micro" style={{ color: "var(--text-muted)" }}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>}
                </button>
              </div>
            )}

            <label className="flex items-center gap-2 text-[13px]">
              <input type="checkbox" checked={form.is_public} onChange={(e) => setForm({ ...form, is_public: e.target.checked })} className="accent-emerald-500" />
              🌐 Public — সবাই দেখতে পারবে
            </label>

            {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-fluid-caption text-rose-700">{error}</div>}

            <button type="submit" disabled={saving}
              className="w-full rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 py-3 text-[14px] font-semibold text-white shadow disabled:opacity-50">
              {saving ? "Uploading..." : "📤 Publish Material"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, placeholder, required }: any) {
  return (
    <div>
      <label className="text-fluid-caption font-medium" style={{ color: "var(--text-muted)" }}>{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required}
        className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[13px] outline-none"
        style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
    </div>
  );
}
