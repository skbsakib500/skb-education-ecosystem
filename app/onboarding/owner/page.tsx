"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const TYPES = [
  { v: "school",     l: "School",         bn: "স্কুল",           e: "🏫" },
  { v: "college",    l: "College",        bn: "কলেজ",            e: "🎓" },
  { v: "university", l: "University",     bn: "বিশ্ববিদ্যালয়",   e: "🏛️" },
  { v: "coaching",   l: "Coaching",       bn: "কোচিং",           e: "📚" },
  { v: "madrasa",    l: "Madrasa",        bn: "মাদ্রাসা",         e: "🕌" },
  { v: "polytechnic",l: "Polytechnic",    bn: "পলিটেকনিক",       e: "⚙️" },
];

const DIVISIONS = ["Dhaka","Chittagong","Rajshahi","Khulna","Barishal","Sylhet","Rangpur","Mymensingh"];

export default function OwnerOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", type: "school", division: "Dhaka", district: "", city: "",
    education_board: "", contact_email: "", contact_phone: "", description: "",
  });

  const update = (k: string, v: string) => setForm({ ...form, [k]: v });

  const next = () => { setError(""); setStep(step + 1); };
  const back = () => { setError(""); setStep(step - 1); };

  const submit = async () => {
    setLoading(true); setError("");
    const { data, error } = await supabase.rpc("request_institution", {
      p_name: form.name, p_type: form.type, p_division: form.division,
      p_district: form.district, p_city: form.city,
      p_education_board: form.education_board, p_contact_email: form.contact_email,
      p_contact_phone: form.contact_phone, p_description: form.description,
    });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/onboarding/pending/?type=owner");
  };

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <Link href="/onboarding/?pick=1" className="text-[13px]" style={{ color: "var(--text-muted)" }}>← Back</Link>
          <div className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Step {step} of 3</div>
        </div>

        <div className="rounded-3xl border p-6 md:p-8" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-[28px]"
            style={{ background: "#10b98120" }}>🏛️</div>
          <h1 className="mt-4 text-[24px] font-semibold">প্রতিষ্ঠান তৈরি করুন</h1>
          <p className="bangla text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>
            SKB Super Admin approve করলে active হবে
          </p>

          <div className="mt-6">
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Institution Type *</label>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {TYPES.map((t) => (
                      <button key={t.v} onClick={() => update("type", t.v)}
                        className={"rounded-xl border p-3 text-left transition " + (form.type === t.v ? "bg-emerald-500/15 border-emerald-500/40" : "")}
                        style={form.type !== t.v ? { borderColor: "var(--border)" } : {}}>
                        <div className="text-[20px]">{t.e}</div>
                        <div className="mt-1 text-[12px] font-semibold">{t.l}</div>
                        <div className="bangla text-[10px]" style={{ color: "var(--text-muted)" }}>{t.bn}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Institution Name *</label>
                  <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)}
                    placeholder="Dhaka Ideal School"
                    className="mt-1 w-full rounded-xl border px-4 py-3 text-[15px] outline-none"
                    style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Division</label>
                    <select value={form.division} onChange={(e) => update("division", e.target.value)}
                      className="mt-1 w-full rounded-xl border px-4 py-3 text-[14px] outline-none"
                      style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                      {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>District</label>
                    <input type="text" value={form.district} onChange={(e) => update("district", e.target.value)}
                      placeholder="Dhaka"
                      className="mt-1 w-full rounded-xl border px-4 py-3 text-[14px] outline-none"
                      style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
                  </div>
                </div>

                <div>
                  <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>City / Area</label>
                  <input type="text" value={form.city} onChange={(e) => update("city", e.target.value)}
                    placeholder="Mirpur, Dhanmondi..."
                    className="mt-1 w-full rounded-xl border px-4 py-3 text-[14px] outline-none"
                    style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
                </div>

                <div>
                  <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Education Board</label>
                  <input type="text" value={form.education_board} onChange={(e) => update("education_board", e.target.value)}
                    placeholder="Dhaka Board / BTEB / Cambridge"
                    className="mt-1 w-full rounded-xl border px-4 py-3 text-[14px] outline-none"
                    style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Contact Email</label>
                    <input type="email" value={form.contact_email} onChange={(e) => update("contact_email", e.target.value)}
                      placeholder="info@school.edu.bd"
                      className="mt-1 w-full rounded-xl border px-4 py-3 text-[14px] outline-none"
                      style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Contact Phone</label>
                    <input type="tel" value={form.contact_phone} onChange={(e) => update("contact_phone", e.target.value)}
                      placeholder="+880 1700-000000"
                      className="mt-1 w-full rounded-xl border px-4 py-3 text-[14px] outline-none"
                      style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
                  </div>
                </div>

                <div>
                  <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Description</label>
                  <textarea value={form.description} onChange={(e) => update("description", e.target.value)}
                    rows={3} placeholder="প্রতিষ্ঠান সম্পর্কে সংক্ষেপে..."
                    className="mt-1 w-full rounded-xl border px-4 py-3 text-[14px] outline-none resize-none"
                    style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
                </div>

                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-[12px] text-emerald-800">
                  ✅ Submit করার পর SKB Super Admin যাচাই করে approve করবেন। সাধারণত ২৪ ঘণ্টার মধ্যে।
                </div>
              </div>
            )}

            {error && <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-[13px] text-rose-700">{error}</div>}

            <div className="mt-6 flex gap-3">
              {step > 1 && (
                <button onClick={back} className="rounded-full border px-5 py-2.5 text-[13px] font-medium"
                  style={{ borderColor: "var(--border)" }}>← Back</button>
              )}
              {step < 3 ? (
                <button onClick={next} disabled={step === 1 && !form.name.trim()}
                  className="flex-1 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 py-3 text-[14px] font-semibold text-white shadow disabled:opacity-50">
                  Continue →
                </button>
              ) : (
                <button onClick={submit} disabled={loading}
                  className="flex-1 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 py-3 text-[14px] font-semibold text-white shadow disabled:opacity-50">
                  {loading ? "Submitting..." : "Submit for Approval"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
