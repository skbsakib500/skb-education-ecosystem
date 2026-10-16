"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export default function Page() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>}><TrackView /></Suspense>;
}

function TrackView() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const no = searchParams.get("no") || "";

  const [query, setQuery] = useState(no);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login/"); return; }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (no && user) runSearch(no);
  }, [no, user]);

  const runSearch = async (value: string) => {
    setLoading(true);
    const { data } = await supabase.rpc("track_application", { p_application_no: value.trim() });
    setResult(data);
    setLoading(false);
    setSearched(true);
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>;

  const statusMeta = (s: string) => ({
    pending:      { l: "Pending Review",     c: "bg-amber-500/15 text-amber-700", e: "⏳" },
    under_review: { l: "Under Review",       c: "bg-cyan-500/15 text-cyan-700", e: "🔍" },
    shortlisted:  { l: "Shortlisted",        c: "bg-violet-500/15 text-violet-700", e: "⭐" },
    approved:     { l: "Approved",           c: "bg-emerald-500/15 text-emerald-700", e: "✅" },
    rejected:     { l: "Rejected",           c: "bg-rose-500/15 text-rose-700", e: "❌" },
    enrolled:     { l: "Enrolled 🎓",         c: "bg-emerald-500/15 text-emerald-700", e: "🎓" },
  } as any)[s] ?? { l: s, c: "", e: "📝" };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Link href="/hub" className="text-[13px]" style={{ color: "var(--text-muted)" }}>← Hub</Link>

        <div className="mt-4 rounded-3xl border p-6" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="text-[20px] font-semibold">📋 Track Application</div>
          <div className="bangla text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>আবেদনের অবস্থা জানুন</div>

          <form onSubmit={(e) => { e.preventDefault(); if (query.trim()) runSearch(query); }} className="mt-5 space-y-3">
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="ADM-XXX-YYMMDD-XXXX"
              className="w-full rounded-xl border px-3.5 py-3 text-[14px] outline-none font-mono text-center"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <button type="submit" disabled={loading || !query.trim()}
              className="w-full rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 py-2.5 text-[13px] font-semibold text-white shadow disabled:opacity-50">
              {loading ? "Searching..." : "Track →"}
            </button>
          </form>

          {searched && !loading && !result && (
            <div className="mt-5 text-center">
              <div className="text-[36px]">❌</div>
              <div className="text-[13px] mt-2" style={{ color: "var(--text-muted)" }}>Application not found</div>
            </div>
          )}

          {result && (
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl text-[22px]"
                    style={{ background: "linear-gradient(135deg,#10b98120,#14b8a620)" }}>
                    {result.institution_emoji || "🏫"}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold truncate">{result.institution_name}</div>
                    <div className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>{result.application_no}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border p-4 space-y-2" style={{ borderColor: "var(--border)" }}>
                <Row l="Applicant" v={result.applicant_name} />
                <Row l="Class" v={result.class_name || "—"} />
                <Row l="Submitted" v={new Date(result.submitted_at).toLocaleString()} />
                {result.reviewed_at && <Row l="Reviewed" v={new Date(result.reviewed_at).toLocaleString()} />}
              </div>

              <div className={"rounded-2xl border p-4 text-center " + statusMeta(result.status).c}
                style={{ borderColor: "transparent" }}>
                <div className="text-[32px]">{statusMeta(result.status).e}</div>
                <div className="text-[14px] font-bold mt-1">{statusMeta(result.status).l}</div>
                {result.review_notes && (
                  <div className="mt-2 text-[12px] italic">"{result.review_notes}"</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Row({ l, v }: any) {
  return (
    <div className="flex justify-between text-[12px]">
      <span style={{ color: "var(--text-muted)" }}>{l}</span>
      <span className="font-medium text-right">{v}</span>
    </div>
  );
}
