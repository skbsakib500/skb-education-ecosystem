"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface Props {
  onSelect: (institution: any) => void;
  onRequestNew: (name: string) => void;
  division?: string;
}

export default function InstitutionSearch({ onSelect, onRequestNew, division }: Props) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [searched, setSearched] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (q.length < 2) { setResults([]); setSearched(false); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      const { data } = await supabase.rpc("search_institutions_fuzzy", {
        p_query: q, p_division: division || null, p_limit: 10,
      });
      setResults(data ?? []);
      setLoading(false); setSearched(true); setOpen(true);
    }, 250);
    return () => clearTimeout(t);
  }, [q, division]);

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2 rounded-xl border px-4 py-3"
        style={{ borderColor: open ? "rgba(16,185,129,0.5)" : "var(--border)", background: "var(--surface-3)" }}>
        <span className="text-[16px]">🔍</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="আপনার প্রতিষ্ঠানের নাম লিখুন..."
          className="w-full bg-transparent text-[14px] outline-none"
        />
        {loading && <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>খোঁজা হচ্ছে...</span>}
      </div>

      {open && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border shadow-2xl"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
          <div className="max-h-[380px] overflow-y-auto">
            {results.length > 0 ? (
              <>
                <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "var(--text-faint)", background: "var(--bg-soft)" }}>
                  Found {results.length} institution{results.length > 1 ? "s" : ""}
                </div>
                {results.map((r) => (
                  <button key={r.id}
                    onClick={() => { onSelect(r); setOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-soft)] text-left border-b last:border-b-0"
                    style={{ borderColor: "var(--border)" }}>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl overflow-hidden text-[20px] shrink-0"
                      style={{ background: "linear-gradient(135deg,#10b981,#14b8a6)" }}>
                      {r.logo_url ? <img src={r.logo_url} alt="" className="h-full w-full object-cover" /> : (r.emoji || "🏫")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-semibold truncate">{r.name}</div>
                      <div className="text-[11px] flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
                        <span className="capitalize">{r.type}</span>
                        {r.city && <span>· 📍 {r.city}</span>}
                        {r.student_count > 0 && <span>· 👥 {r.student_count}</span>}
                      </div>
                    </div>
                    <span className="text-[11px] font-mono" style={{ color: "var(--text-faint)" }}>
                      /{r.slug}
                    </span>
                  </button>
                ))}
              </>
            ) : searched && !loading ? (
              <div className="p-5 text-center">
                <div className="text-[32px]">🏛️</div>
                <div className="mt-2 text-[13px] font-medium">কোনো প্রতিষ্ঠান পাওয়া যায়নি</div>
                <div className="bangla text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>
                  "{q}" নামে কোনো প্রতিষ্ঠান এখনো SKB-তে নেই
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t p-2" style={{ borderColor: "var(--border)", background: "var(--bg-soft)" }}>
            <button
              onClick={() => { onRequestNew(q); setOpen(false); }}
              className="w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] font-medium hover:bg-[var(--surface-3)] transition">
              <span className="text-[16px]">➕</span>
              <span>আমার প্রতিষ্ঠান এখানে নেই — Request যোগ করুন</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
