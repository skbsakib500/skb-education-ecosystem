"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

const TYPES: Array<{ v: string; l: string; e: string }> = [
  { v: "", l: "All", e: "📁" },
  { v: "pdf", l: "PDF", e: "📄" },
  { v: "video", l: "Video", e: "🎥" },
  { v: "note", l: "Note", e: "📝" },
  { v: "link", l: "Link", e: "🔗" },
  { v: "audio", l: "Audio", e: "🎵" },
  { v: "image", l: "Image", e: "🖼️" },
  { v: "doc", l: "Doc", e: "📃" },
  { v: "ppt", l: "PPT", e: "📊" },
];

const SUBJECTS = ["Physics","Chemistry","Biology","Math","English","Bangla","ICT","Accounting","Economics","Arabic","Others"];

export default function MaterialsPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [subject, setSubject] = useState("");

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login/"); return; }
  }, [user, authLoading, router]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.rpc("search_materials", {
      p_query: q, p_type: type || null, p_subject: subject || null,
      p_institution_id: null, p_limit: 50,
    });
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const toggleBookmark = async (materialId: string, isBookmarked: boolean) => {
    if (!user) return;
    if (isBookmarked) {
      await supabase.from("material_bookmarks").delete().eq("user_id", user.id).eq("material_id", materialId);
    } else {
      await supabase.from("material_bookmarks").insert({ user_id: user.id, material_id: materialId });
    }
    load();
  };

  const openMaterial = async (m: any) => {
    await supabase.rpc("increment_material_views", { p_material_id: m.id });
    const url = m.external_url || m.file_url;
    if (url) {
      await supabase.rpc("record_material_download", { p_material_id: m.id });
      window.open(url, "_blank");
    }
    load();
  };

  const typeMeta = (t: string) => TYPES.find((x) => x.v === t) ?? TYPES[0];

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 border-b"
        style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/hub" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-[14px] shadow-lg">📚</div>
            <div className="leading-tight">
              <div className="text-[14px] font-semibold">Study Materials</div>
              <div className="bangla text-[11px]" style={{ color: "var(--text-muted)" }}>পাঠ্য সামগ্রী</div>
            </div>
          </Link>
          <div className="flex gap-2">
            <Link href="/materials/upload" className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow">+ Upload</Link>
            <button onClick={signOut} className="rounded-full border px-3 py-1.5 text-[12px]" style={{ borderColor: "var(--border)" }}>Sign out</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pt-6">
        <div className="rounded-3xl bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-500 p-6 text-white">
          <h1 className="text-[24px] font-semibold">📚 Study Materials</h1>
          <p className="text-[13px] mt-1 text-white/90">PDF, Video, Note, Link — সব এক জায়গায়</p>
        </div>

        <div className="mt-5 flex gap-2 flex-wrap">
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="🔍 Search materials..."
            className="flex-1 min-w-[180px] rounded-full border px-4 py-2.5 text-[13px] outline-none"
            style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
          <select value={subject} onChange={(e) => setSubject(e.target.value)}
            className="rounded-full border px-4 py-2.5 text-[13px] outline-none"
            style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            <option value="">All subjects</option>
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={load} className="rounded-full bg-emerald-500/15 px-4 py-2 text-[12px] font-semibold text-emerald-700">Apply</button>
        </div>

        <div className="mt-4 flex gap-1.5 overflow-x-auto pb-2">
          {TYPES.map((t) => (
            <button key={t.v} onClick={() => { setType(t.v); load(); }}
              className={"rounded-full border px-3 py-1.5 text-[11px] font-medium whitespace-nowrap transition " + (type === t.v ? "bg-[var(--text)] text-[var(--bg)]" : "")}
              style={type !== t.v ? { borderColor: "var(--border)" } : {}}>
              {t.e} {t.l}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>
        ) : items.length === 0 ? (
          <div className="mt-6 rounded-2xl border p-12 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            <div className="text-[48px]">📚</div>
            <div className="mt-3 text-[15px] font-semibold">No materials yet</div>
            <div className="bangla text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>প্রথম material upload করুন</div>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((m) => {
              const tm = typeMeta(m.type);
              return (
                <div key={m.id} className="rounded-2xl border overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                  {m.thumbnail_url ? (
                    <div className="h-32 bg-cover bg-center" style={{ backgroundImage: "url(" + m.thumbnail_url + ")" }} />
                  ) : (
                    <div className="h-32 flex items-center justify-center text-[48px]"
                      style={{ background: "linear-gradient(135deg,#10b98120,#14b8a620)" }}>
                      {tm.e}
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-[14px] font-semibold line-clamp-2">{m.title}</div>
                        <div className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
                          {m.subject && <span>{m.subject} · </span>}
                          by {m.uploader_name || "Anonymous"}
                        </div>
                      </div>
                      <button onClick={() => toggleBookmark(m.id, m.is_bookmarked)}
                        className="rounded-full w-7 h-7 flex items-center justify-center text-[14px] hover:bg-[var(--bg-soft)]">
                        {m.is_bookmarked ? "🔖" : "📑"}
                      </button>
                    </div>
                    {m.description && <p className="mt-2 text-[11px] line-clamp-2" style={{ color: "var(--text-muted)" }}>{m.description}</p>}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-[10px] flex gap-2" style={{ color: "var(--text-faint)" }}>
                        <span>👁 {m.views}</span>
                        <span>⬇ {m.downloads}</span>
                      </div>
                      <button onClick={() => openMaterial(m)}
                        className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow">
                        {m.type === "link" ? "Open →" : "Download →"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
