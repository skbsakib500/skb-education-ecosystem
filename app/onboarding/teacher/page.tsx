"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import InstitutionSearch from "@/components/InstitutionSearch";

const SUBJECTS = ["Physics","Chemistry","Biology","Math","English","Bangla","ICT","Accounting","Economics"];

export default function TeacherOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedInst, setSelectedInst] = useState<any>(null);
  const [requestName, setRequestName] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [experience, setExperience] = useState("1-3");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleSubj = (s: string) => setSubjects((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const submit = async () => {
    setLoading(true); setError("");

    if (selectedInst) {
      const { error } = await supabase.rpc("request_to_join", {
        p_institution_id: selectedInst.id,
        p_role: "teacher",
        p_metadata: { subjects, experience },
      });
      if (error) { setError(error.message); setLoading(false); return; }
      await supabase.rpc("record_user_intent", { p_intended_role: "teacher", p_step: 3 });
      router.push("/onboarding/pending/?type=teacher");
    } else if (requestName) {
      const { error } = await supabase.rpc("request_institution", {
        p_name: requestName, p_type: "school", p_division: "Dhaka", p_district: "",
        p_city: "", p_education_board: "", p_contact_email: "", p_contact_phone: "", p_description: "",
      });
      if (error) { setError(error.message); setLoading(false); return; }
      router.push("/onboarding/pending/?type=teacher");
    } else {
      setError("একটি প্রতিষ্ঠান select করুন বা নতুন request দিন");
      setLoading(false);
    }
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
            style={{ background: "#8b5cf620" }}>👨‍🏫</div>
          <h1 className="mt-4 text-[24px] font-semibold">শিক্ষক হিসেবে যুক্ত হন</h1>
          <p className="bangla text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>
            প্রতিষ্ঠান admin approve করলে active হবে
          </p>

          {step === 1 && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-[12px] font-medium mb-2 block" style={{ color: "var(--text-muted)" }}>
                  আপনার প্রতিষ্ঠান খুঁজুন
                </label>
                <InstitutionSearch
                  onSelect={(i) => { setSelectedInst(i); setRequestName(""); }}
                  onRequestNew={(n) => { setRequestName(n); setSelectedInst(null); }}
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
                    <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>{selectedInst.city || selectedInst.division}</div>
                  </div>
                  <button onClick={() => setSelectedInst(null)} className="text-[12px] text-rose-600">Change</button>
                </div>
              )}

              {requestName && !selectedInst && (
                <div className="rounded-xl border-2 border-amber-500/40 bg-amber-500/5 p-4">
                  <div className="text-[13px] font-semibold">📝 নতুন প্রতিষ্ঠান request: {requestName}</div>
                  <div className="text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>
                    SKB Super Admin approve করবেন, তারপর আপনি admin হবেন
                  </div>
                </div>
              )}

              {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-[13px] text-rose-700">{error}</div>}

              <div className="flex gap-3 mt-4">
                <button onClick={submit} disabled={loading || (!selectedInst && !requestName)}
                  className="flex-1 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 py-3 text-[14px] font-semibold text-white shadow disabled:opacity-50">
                  {loading ? "Submitting..." : "Continue →"}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>যে বিষয়গুলো পড়ান</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SUBJECTS.map((s) => (
                    <button key={s} onClick={() => toggleSubj(s)}
                      className={"rounded-full border px-3 py-1.5 text-[12px] font-medium transition " + (subjects.includes(s) ? "bg-violet-500/15 border-violet-500/40 text-violet-700" : "")}
                      style={!subjects.includes(s) ? { borderColor: "var(--border)" } : {}}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>অভিজ্ঞতা</label>
                <select value={experience} onChange={(e) => setExperience(e.target.value)}
                  className="mt-1 w-full rounded-xl border px-4 py-3 text-[14px] outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                  <option value="0-1">0-1 বছর</option>
                  <option value="1-3">1-3 বছর</option>
                  <option value="3-5">3-5 বছর</option>
                  <option value="5-10">5-10 বছর</option>
                  <option value="10+">10+ বছর</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)} className="rounded-full border px-5 py-2.5 text-[13px]"
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
