"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import InstitutionSearch from "@/components/InstitutionSearch";

export default function ParentOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedInst, setSelectedInst] = useState<any>(null);
  const [childName, setChildName] = useState("");
  const [childRoll, setChildRoll] = useState("");
  const [relationship, setRelationship] = useState("guardian");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setLoading(true); setError("");
    const { error } = await supabase.rpc("request_to_join", {
      p_institution_id: selectedInst.id, p_role: "parent",
      p_metadata: { child_name: childName, child_roll: childRoll, relationship },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    await supabase.rpc("record_user_intent", { p_intended_role: "parent", p_step: 2 });
    router.push("/onboarding/pending/?type=parent");
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
            style={{ background: "#14b8a620" }}>👪</div>
          <h1 className="mt-4 text-[24px] font-semibold">অভিভাবক হিসেবে যুক্ত হন</h1>
          <p className="bangla text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>
            সন্তানের অগ্রগতি, ফলাফল, ফি সব দেখতে পারবেন
          </p>

          {step === 1 && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-[12px] font-medium mb-2 block" style={{ color: "var(--text-muted)" }}>
                  সন্তানের প্রতিষ্ঠান
                </label>
                <InstitutionSearch
                  onSelect={(i) => setSelectedInst(i)}
                  onRequestNew={() => {}}
                />
              </div>

              {selectedInst && (
                <div className="rounded-xl border-2 border-teal-500/40 bg-teal-500/5 p-4">
                  <div className="text-[13px] font-semibold">✅ {selectedInst.name}</div>
                </div>
              )}

              {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-[13px] text-rose-700">{error}</div>}

              <button onClick={() => selectedInst && setStep(2)} disabled={!selectedInst}
                className="w-full rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 py-3 text-[14px] font-semibold text-white shadow disabled:opacity-50">
                Continue →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>সন্তানের নাম</label>
                <input type="text" value={childName} onChange={(e) => setChildName(e.target.value)}
                  placeholder="Sakib Al Hasan"
                  className="mt-1 w-full rounded-xl border px-4 py-3 text-[14px] outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
              </div>
              <div>
                <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>সন্তানের Roll</label>
                <input type="text" value={childRoll} onChange={(e) => setChildRoll(e.target.value)}
                  placeholder="01"
                  className="mt-1 w-full rounded-xl border px-4 py-3 text-[14px] outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
              </div>
              <div>
                <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>সম্পর্ক</label>
                <select value={relationship} onChange={(e) => setRelationship(e.target.value)}
                  className="mt-1 w-full rounded-xl border px-4 py-3 text-[14px] outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                  <option value="father">👨 বাবা</option>
                  <option value="mother">👩 মা</option>
                  <option value="guardian">👤 অভিভাবক</option>
                  <option value="other">অন্যান্য</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)} className="rounded-full border px-5 py-2.5 text-[13px]"
                  style={{ borderColor: "var(--border)" }}>← Back</button>
                <button onClick={submit} disabled={loading || !childName.trim()}
                  className="flex-1 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 py-3 text-[14px] font-semibold text-white shadow disabled:opacity-50">
                  {loading ? "Submitting..." : "Submit Link Request"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
