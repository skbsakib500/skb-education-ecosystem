"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import PremiumIdCard from "@/components/institution/PremiumIdCard";

export default function Page() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>}><VerifyView /></Suspense>;
}

function VerifyView() {
  const searchParams = useSearchParams();
  const studentCode = searchParams.get("id");

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!studentCode) { setError("No student ID provided"); setLoading(false); return; }
    (async () => {
      const { data: s } = await supabase.from("students")
        .select("*, institutions:institution_id(name, slug, emoji, logo_url, motto), classes:class_id(name, section)")
        .eq("student_id", studentCode).maybeSingle();
      if (!s) { setError("Student not found"); setLoading(false); return; }

      const { data: tier } = await supabase.rpc("get_card_tier", { p_student_id: s.id });
      setData({ student: s, tier: tier || "bronze" });
      setLoading(false);
    })();
  }, [studentCode]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold shadow-lg">SKB</div>
        </Link>

        <div className="mt-6">
          {loading ? (
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          ) : error ? (
            <div className="rounded-2xl border p-8" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <div className="text-[48px]">❌</div>
              <div className="mt-3 text-[16px] font-semibold">Verification Failed</div>
              <div className="text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>{error}</div>
            </div>
          ) : data ? (
            <div className="space-y-4">
              <div className="rounded-2xl border p-4 bg-emerald-500/10 border-emerald-500/40">
                <div className="flex items-center justify-center gap-2 text-emerald-700">
                  <span className="text-[24px]">✅</span>
                  <span className="text-[15px] font-bold">VERIFIED STUDENT</span>
                </div>
              </div>

              <div className="flex justify-center">
                <PremiumIdCard
                  tier={data.tier}
                  institution={{
                    name: data.student.institutions?.name,
                    logo_url: data.student.institutions?.logo_url,
                    emoji: data.student.institutions?.emoji,
                    motto: data.student.institutions?.motto,
                  }}
                  student={{
                    full_name: data.student.full_name,
                    student_id: data.student.student_id,
                    roll_number: data.student.roll_number,
                    class_name: data.student.classes?.name,
                    section: data.student.classes?.section,
                    class_role: data.student.class_role,
                  }}
                />
              </div>

              <div className="rounded-2xl border p-4 text-left" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Verified Details</div>
                <div className="space-y-1.5 text-[13px]">
                  <Row label="Name" value={data.student.full_name} />
                  <Row label="Student ID" value={data.student.student_id || "—"} />
                  <Row label="Institution" value={data.student.institutions?.name || "—"} />
                  <Row label="Class" value={(data.student.classes?.name || "—") + (data.student.classes?.section ? " · " + data.student.classes.section : "")} />
                  <Row label="Tier" value={data.tier.toUpperCase()} />
                </div>
              </div>

              <div className="text-[11px]" style={{ color: "var(--text-faint)" }}>
                Verified by SKB Education Ecosystem
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 border-b last:border-b-0" style={{ borderColor: "var(--border)" }}>
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
