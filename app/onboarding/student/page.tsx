"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import InstitutionSearch from "@/components/InstitutionSearch";
import { INTERESTS } from "@/lib/onboarding";

export default function StudentOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedInst, setSelectedInst] = useState<any>(null);
  const [roll, setRoll] = useState("");
  const [className, setClassName] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggle = (s: string) => setInterests((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);

  const goPersonal = async () => {
    setLoading(true);
    await supabase.rpc("complete_onboarding", {
      p_primary_role: "student", p_sub_role: "self",
      p_interests: interests, p_preferences: { personal: true },
    });
    router.push("/personal/");
  };

  const submit = async () => {
    setLoading(true); setError("");
    const { error } = await supabase.rpc("request_to_join", {
      p_institution_id: selectedInst.id,
      p_role: "student",
      p_metadata: { roll_number: roll, class_name: className, interests },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    await supabase.rpc("record_user_intent", { p_intended_role: "student", p_step: 3 });
    router.push("/onboarding/pending/?type=student");
  };

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <Link href="/onboarding/?pick=1" className="text-[13px]" style={{ color: "var(--text-muted)" }}>← Back</Link>
          <div className="text-fluid-caption font-medium" style={{ color: "var(--text-muted)" }}>Step {step} of 3</div>
        </div>

        <div className="rounded-3xl border p-6 md:p-8" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-[28px]"
            style={{ background: "#06b6d420" }}>🎓</div>
          <h1 className="mt-4 text-[24px] font-semibold">শিক্ষার্থী হিসেবে যুক্ত হন</h1>

          {step === 1 && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-fluid-caption font-medium mb-2 block" style={{ color: "var(--text-muted)" }}>
                  আপনার প্রতিষ্ঠান খুঁজুন
                </label>
                <InstitutionSearch
                  onSelect={(i) => { setSelectedInst(i); }}
                  onRequestNew={(n) => {
                    // Personal space path
                    setSelectedInst(null);
                  }}
                />
              </div>

              {selectedInst && (
                <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/5 p-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl overflow-hidden text-[20px]"
                    style={{ background: "linear-gradient(135deg,#10b981,#14b8a6)" }}>
                    {selectedInst.logo_url ? <img src={selectedInst.logo_url} className="h-full w-full object-cover" alt="" /> : (selectedInst.emoji || "🏫")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold truncate">{selectedInst.name}</div>
                    <div className="text-fluid-micro" style={{ color: "var(--text-muted)" }}>{selectedInst.city || selectedInst.division}</div>
                  </div>
                  <button onClick={() => setSelectedInst(null)} className="text-fluid-caption text-rose-600">Change</button>
                </div>
              )}

              <button onClick={goPersonal}
                className="w-full rounded-xl border-2 border-dashed p-4 text-center transition hover:border-rose-500/40"
                style={{ borderColor: "var(--border-strong)" }}>
                <div className="text-[20px]">🎯</div>
                <div className="text-[13px] font-semibold mt-1">Personal Space ব্যবহার করুন</div>
                <div className="bangla text-fluid-micro" style={{ color: "var(--text-muted)" }}>
                  প্রতিষ্ঠান ছাড়াই self-study, notes, practice
                </div>
              </button>

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
                <label className="text-fluid-caption font-medium" style={{ color: "var(--text-muted)" }}>Class / Grade</label>
                <input type="text" value={className} onChange={(e) => setClassName(e.target.value)}
                  placeholder="Class 10 / HSC 1 / Ebtedayee 3"
                  className="mt-1 w-full rounded-xl border px-4 py-3 text-[14px] outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
              </div>
              <div>
                <label className="text-fluid-caption font-medium" style={{ color: "var(--text-muted)" }}>Roll Number (যদি থাকে)</label>
                <input type="text" value={roll} onChange={(e) => setRoll(e.target.value)}
                  placeholder="01"
                  className="mt-1 w-full rounded-xl border px-4 py-3 text-[14px] outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)} className="rounded-full border px-5 py-2.5 text-[13px]"
                  style={{ borderColor: "var(--border)" }}>← Back</button>
                <button onClick={() => setStep(3)} className="flex-1 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 py-3 text-[14px] font-semibold text-white shadow">
                  Continue →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-fluid-caption font-medium" style={{ color: "var(--text-muted)" }}>আপনি কোন বিষয়ে আগ্রহী?</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {INTERESTS.map((s) => (
                    <button key={s} onClick={() => toggle(s)}
                      className={"rounded-full border px-3 py-1.5 text-fluid-caption font-medium transition " + (interests.includes(s) ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-700" : "")}
                      style={!interests.includes(s) ? { borderColor: "var(--border)" } : {}}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(2)} className="rounded-full border px-5 py-2.5 text-[13px]"
                  style={{ borderColor: "var(--border)" }}>← Back</button>
                <button onClick={submit} disabled={loading}
                  className="flex-1 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 py-3 text-[14px] font-semibold text-white shadow disabled:opacity-50">
                  {loading ? "Submitting..." : "Submit Join Request"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
