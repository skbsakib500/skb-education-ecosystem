"use client";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function QuickSearch({ institutionId }: { institutionId: string }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (q.length < 2) { setResults(null); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      const { data } = await supabase.rpc("search_institution", {
        p_institution_id: institutionId, p_query: q,
      });
      setResults(data);
      setLoading(false);
      setOpen(true);
    }, 300);
    return () => clearTimeout(t);
  }, [q, institutionId]);

  const total = results
    ? (results.students?.length || 0) + (results.teachers?.length || 0) + (results.classes?.length || 0) + (results.exams?.length || 0)
    : 0;

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-2 rounded-full border px-3.5 py-1.5"
        style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
        <span className="text-[14px]">🔍</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results && setOpen(true)}
          placeholder="Search students, teachers, exams..."
          className="w-full bg-transparent text-[13px] outline-none md:w-[220px]"
        />
      </div>

      {open && q.length >= 2 && (
        <div className="absolute right-0 mt-2 z-40 w-[380px] max-w-[92vw] overflow-hidden rounded-2xl border shadow-2xl"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="max-h-[420px] overflow-y-auto p-2">
            {loading ? (
              <div className="py-6 text-center text-[12px]" style={{ color: "var(--text-muted)" }}>Searching...</div>
            ) : total === 0 ? (
              <div className="py-8 text-center">
                <div className="text-[24px]">🔍</div>
                <div className="mt-2 text-[12px]" style={{ color: "var(--text-muted)" }}>No results</div>
              </div>
            ) : (
              <>
                {results.students?.length > 0 && (
                  <Section title={`Students (${results.students.length})`}>
                    {results.students.map((s: any) => (
                      <Item key={s.id} emoji="🎓" title={s.full_name} sub={s.student_id || s.roll_number || "Student"} />
                    ))}
                  </Section>
                )}
                {results.teachers?.length > 0 && (
                  <Section title={`Staff (${results.teachers.length})`}>
                    {results.teachers.map((t: any) => (
                      <Item key={t.user_id} emoji="👨‍🏫" title={t.full_name || "Unnamed"} sub={`${t.role} · ${t.email || ""}`} />
                    ))}
                  </Section>
                )}
                {results.classes?.length > 0 && (
                  <Section title={`Classes (${results.classes.length})`}>
                    {results.classes.map((c: any) => (
                      <Item key={c.id} emoji="📚" title={c.name} sub={c.section || "Class"} />
                    ))}
                  </Section>
                )}
                {results.exams?.length > 0 && (
                  <Section title={`Exams (${results.exams.length})`}>
                    {results.exams.map((e: any) => (
                      <Item key={e.id} emoji="📝" title={e.title} sub={`${e.subject || ""} · ${e.status}`} />
                    ))}
                  </Section>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div className="mb-2 last:mb-0">
      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest"
        style={{ color: "var(--text-faint)" }}>{title}</div>
      {children}
    </div>
  );
}

function Item({ emoji, title, sub }: any) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-[var(--bg-soft)]">
      <span className="text-[16px]">{emoji}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium truncate">{title}</div>
        <div className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>{sub}</div>
      </div>
    </div>
  );
}
