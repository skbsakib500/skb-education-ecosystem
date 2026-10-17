"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

const CATS = [
  { value: "", label: "All" },
  { value: "general", label: "General" },
  { value: "research", label: "Research" },
  { value: "student", label: "Student" },
  { value: "faculty", label: "Faculty" },
  { value: "literary", label: "Literary" },
  { value: "science", label: "Science" },
  { value: "arts", label: "Arts" },
];

export default function JournalsPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("");

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login/"); return; }
    if (!user) return;
    (async () => {
      let q = supabase.from("journals").select("*, profiles:owner_id(full_name, username, avatar_url)")
        .eq("is_public", true).order("created_at", { ascending: false });
      if (cat) q = q.eq("category", cat);
      const { data } = await q;
      setItems(data ?? []);
      setLoading(false);
    })();
  }, [user, authLoading, router, cat]);

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 border-b" style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/hub" className="text-[13px]" style={{ color: "var(--text-muted)" }}>← Hub</Link>
          <div className="flex gap-2">
            <Link href="/journals/new" className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-1.5 text-fluid-caption font-semibold text-white shadow">+ New Journal</Link>
            <button onClick={signOut} className="rounded-full border px-3 py-1.5 text-fluid-caption" style={{ borderColor: "var(--border)" }}>Sign out</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pt-6">
        <div className="rounded-3xl bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-500 p-6 text-white">
          <h1 className="text-[24px] font-semibold">📔 Journals</h1>
          <p className="text-[13px] mt-1 text-white/90">গবেষণা, প্রবন্ধ, ছাত্র-লেখা — সব প্রকাশ করুন</p>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto">
          {CATS.map((c) => (
            <button key={c.value} onClick={() => setCat(c.value)}
              className={"rounded-full border px-4 py-1.5 text-fluid-caption font-medium whitespace-nowrap " + (cat === c.value ? "bg-[var(--text)] text-[var(--bg)]" : "")}
              style={cat !== c.value ? { borderColor: "var(--border)" } : {}}>{c.label}</button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>
        ) : items.length === 0 ? (
          <div className="mt-6 rounded-2xl border p-12 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            <div className="text-[48px]">📔</div>
            <div className="mt-3 text-[15px] font-semibold">No journals yet</div>
            <div className="bangla text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>প্রথম journal খুলুন</div>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((j) => (
              <Link key={j.id} href={"/journals/view/?slug=" + j.slug}
                className="rounded-2xl border p-5 hover:-translate-y-0.5 hover:shadow-md transition"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <div className="text-[18px]">📔</div>
                <div className="mt-2 text-[16px] font-semibold">{j.name}</div>
                <div className="text-fluid-micro mt-1" style={{ color: "var(--text-muted)" }}>
                  by {j.profiles?.full_name || "Anonymous"}
                </div>
                {j.description && <div className="text-fluid-caption mt-2 line-clamp-2" style={{ color: "var(--text-muted)" }}>{j.description}</div>}
                <div className="mt-3 flex gap-3 text-fluid-micro" style={{ color: "var(--text-muted)" }}>
                  <span>📄 {j.articles_count} articles</span>
                  <span>👥 {j.followers_count} followers</span>
                  <span className="capitalize">{j.category}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
