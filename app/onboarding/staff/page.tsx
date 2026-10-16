"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import InstitutionSearch from "@/components/InstitutionSearch";
import { SUB_ROLES } from "@/lib/onboarding";

export default function StaffOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [subRole, setSubRole] = useState("accountant");
  const [selectedInst, setSelectedInst] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setLoading(true); setError("");
    const { error } = await supabase.rpc("request_to_join", {
      p_institution_id: selectedInst.id, p_role: subRole, p_metadata: {},
    });
    if (error) { setError(error.message); setLoading(false); return; }
    await supabase.rpc("record_user_intent", { p_intended_role: "staff", p_sub_role: subRole });
    router.push("/onboarding/pending/?type=staff");
  };

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <Link href="/onboarding" className="text-[13px]" style={{ color: "var(--text-muted)" }}>← Back</Link>
          <div className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Step {step} of 2</div>
        </div>

        <div className="rounded-3xl border p-6 md:p-8" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-[28px]"
            style={{ background: "#f59e0b20" }}>💼</div>
          <h1 className="mt-4 text-[24px] font-semibold">কর্মী হিসেবে যুক্ত হন</h1>

          {step === 1 && (
            <div className="mt-6 space-y-5">
              <div>
                <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>আপনার পদ</label>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {SUB_ROLES.staff.map((s) => (
                    <button key={s.key} onClick={() => setSubRole(s.key)}
                      className={"rounded-xl border p-3 text-left " + (subRole === s.key ? "bg-amber-500/15 border-amber-500/40" : "")}
                      style={subRole !== s.key ? { borderColor: "var(--border)" } : {}}>
                      <div className="text-[20px]">{s.emoji}</div>
                      <div className="mt-1 text-[12px] font-semibold">{s.label}</div>
                      <div className="bangla text-[10px]" style={{ color: "var(--text-muted)" }}>{s.bn}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[12px] font-medium mb-2 block" style={{ color: "var(--text-muted)" }}>প্রতিষ্ঠান খুঁজুন</label>
                <InstitutionSearch onSelect={(i) => setSelectedInst(i)} onRequestNew={() => {}} />
              </div>

              {selectedInst && (
                <div className="rounded-xl border-2 border-amber-500/40 bg-amber-500/5 p-4">
                  <div className="text-[13px] font-semibold">✅ {selectedInst.name}</div>
                </div>
              )}

              {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-[13px] text-rose-700">{error}</div>}

              <button onClick={submit} disabled={loading || !selectedInst}
                className="w-full rounded-full bg-gradient-to-br from-amber-500 to-orange-500 py-3 text-[14px] font-semibold text-white shadow disabled:opacity-50">
                {loading ? "Submitting..." : "Submit Join Request"}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
