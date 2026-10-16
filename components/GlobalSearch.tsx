"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen(true); }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onClick); document.removeEventListener("keydown", onKey); };
  }, []);

  useEffect(() => {
    if (q.length < 2) { setResults(null); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      const { data } = await supabase.rpc("global_search", { p_query: q, p_limit: 5 });
      setResults(data);
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const total = results ? Object.values(results).reduce((s: number, arr: any) => s + (Array.isArray(arr) ? arr.length : 0), 0) : 0;

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] transition hover:border-emerald-500/40"
        style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
        <span className="text-[13px]">🔍</span>
        <span className="hidden md:inline" style={{ color: "var(--text-muted)" }}>Search...</span>
        <kbd className="hidden md:inline rounded bg-[var(--bg-soft)] px-1.5 py-0.5 text-[10px] font-mono" style={{ color: "var(--text-faint)" }}>⌘K</kbd>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setOpen(false)} />
          <div className="fixed left-1/2 top-[15%] z-50 w-[92vw] max-w-2xl -translate-x-1/2 overflow-hidden rounded-2xl border shadow-2xl"
            style={{ borderColor: "var(--border)", background: "var(--surface-3)", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div className="flex items-center gap-3 border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
              <span className="text-[16px]">🔍</span>
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="Search users, institutions, posts, jobs, discussions..."
                className="flex-1 bg-transparent text-[14px] outline-none" />
              {loading && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />}
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {!results && q.length < 2 ? (
                <div className="py-12 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
                  Type at least 2 characters...
                </div>
              ) : total === 0 ? (
                <div className="py-12 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
                  No results for "{q}"
                </div>
              ) : (
                <div className="p-2">
                  {results.users?.length > 0 && (
                    <Section label="👥 Users" items={results.users.map((u: any) => ({
                      href: "/u/?username=" + (u.username || ""),
                      title: u.full_name, sub: "@" + u.username + (u.headline ? " · " + u.headline : ""),
                    }))} onClick={() => setOpen(false)} />
                  )}
                  {results.institutions?.length > 0 && (
                    <Section label="🏛️ Institutions" items={results.institutions.map((i: any) => ({
                      href: "/institutions/view/?slug=" + i.slug,
                      title: i.name, sub: (i.city || "—") + " · " + i.type,
                    }))} onClick={() => setOpen(false)} />
                  )}
                  {results.tutors?.length > 0 && (
                    <Section label="🎓 Tutors" items={results.tutors.map((t: any) => ({
                      href: "/u/?username=" + (t.username || ""),
                      title: t.full_name, sub: t.headline + " · " + (t.hourly_rate_bdt ? "৳" + t.hourly_rate_bdt + "/hr" : "Negotiable"),
                    }))} onClick={() => setOpen(false)} />
                  )}
                  {results.jobs?.length > 0 && (
                    <Section label="💼 Jobs" items={results.jobs.map((j: any) => ({
                      href: "/jobs/view/?id=" + j.id,
                      title: j.title, sub: (j.institution_name || "Independent") + " · " + j.role_type,
                    }))} onClick={() => setOpen(false)} />
                  )}
                  {results.posts?.length > 0 && (
                    <Section label="💬 Posts" items={results.posts.map((p: any) => ({
                      href: "/u/?username=" + (p.author_username || ""),
                      title: p.author_name, sub: p.content,
                    }))} onClick={() => setOpen(false)} />
                  )}
                  {results.discussions?.length > 0 && (
                    <Section label="💡 Discussions" items={results.discussions.map((d: any) => ({
                      href: "/discussions/view/?id=" + d.id,
                      title: d.title, sub: (d.topic || "") + " · " + d.answers_count + " answers",
                    }))} onClick={() => setOpen(false)} />
                  )}
                  {results.journals?.length > 0 && (
                    <Section label="📔 Journals" items={results.journals.map((j: any) => ({
                      href: "/journals/view/?slug=" + j.slug,
                      title: j.name, sub: (j.description || "").slice(0, 60),
                    }))} onClick={() => setOpen(false)} />
                  )}
                </div>
              )}
            </div>

            <div className="border-t px-4 py-2 text-center text-[10px] font-mono"
              style={{ borderColor: "var(--border)", background: "var(--bg-soft)", color: "var(--text-faint)" }}>
              {total} results · Esc to close
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Section({ label, items, onClick }: any) {
  return (
    <div className="mb-1 last:mb-0">
      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>{label}</div>
      {items.map((it: any, i: number) => (
        <Link key={i} href={it.href} onClick={onClick}
          className="block rounded-xl px-3 py-2 transition hover:bg-[var(--bg-soft)]">
          <div className="text-[13px] font-medium truncate">{it.title}</div>
          {it.sub && <div className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>{it.sub}</div>}
        </Link>
      ))}
    </div>
  );
}
