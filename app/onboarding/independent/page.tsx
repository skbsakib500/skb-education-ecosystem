"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { SUB_ROLES, INTERESTS } from "@/lib/onboarding";

export default function IndependentOnboarding() {
  const router = useRouter();
  const [subRole, setSubRole] = useState("tutor");
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggle = (s: string) => setInterests((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);

  const submit = async () => {
    setLoading(true);
    await supabase.rpc("complete_onboarding", {
      p_primary_role: "independent", p_sub_role: subRole,
      p_interests: interests, p_preferences: {},
    });
    router.push("/personal/");
  };

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <Link href="/onboarding" className="text-[13px]" style={{ color: "var(--text-muted)" }}>← Back</Link>
        </div>

        <div className="rounded-3xl border p-6 md:p-8" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-[28px]"
            style={{ background: "#f43f5e20" }}>🎯</div>
          <h1 className="mt-4 text-[24px] font-semibold">Independent হিসেবে শুরু করুন</h1>
          <p className="bangla text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>
            প্রতিষ্ঠান ছাড়াই শেখা, পড়ানো, বা কনটেন্ট তৈরি
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>আপনি কী করতে চান?</label>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SUB_ROLES.independent.map((s) => (
                  <button key={s.key} onClick={() => setSubRole(s.key)}
                    className={"rounded-xl border p-4 text-left " + (subRole === s.key ? "bg-rose-500/15 border-rose-500/40" : "")}
                    style={subRole !== s.key ? { borderColor: "var(--border)" } : {}}>
                    <div className="text-[22px]">{s.emoji}</div>
                    <div className="mt-2 text-[13px] font-semibold">{s.label}</div>
                    <div className="bangla text-[11px]" style={{ color: "var(--text-muted)" }}>{s.bn}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>আগ্রহের বিষয়</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {INTERESTS.map((s) => (
                  <button key={s} onClick={() => toggle(s)}
                    className={"rounded-full border px-3 py-1.5 text-[12px] font-medium " + (interests.includes(s) ? "bg-rose-500/15 border-rose-500/40 text-rose-700" : "")}
                    style={!interests.includes(s) ? { borderColor: "var(--border)" } : {}}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={submit} disabled={loading}
              className="w-full rounded-full bg-gradient-to-br from-rose-500 to-pink-600 py-3 text-[14px] font-semibold text-white shadow disabled:opacity-50">
              {loading ? "Setting up..." : "Start Personal Space →"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
