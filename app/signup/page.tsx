"use client";
import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { DIVISIONS, getDistricts } from "@/lib/bangladesh-data";

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    institution_name: "",
    institution_slug: "",
    institution_type: "high_school",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submitAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setStep(2);
    setLoading(false);
  };

  const submitInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setError("Please verify your email first, then sign in.");
      setLoading(false);
      return;
    }

    const { data: inst, error: instErr } = await supabase
      .from("institutions")
      .insert({
        name: form.institution_name,
        slug: form.institution_slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        type: form.institution_type,
        owner_email: form.email,
      })
      .select()
      .single();

    if (instErr) {
      setError(instErr.message);
      setLoading(false);
      return;
    }

    const { error: memErr } = await supabase.from("memberships").insert({
      institution_id: inst.id,
      user_id: userData.user.id,
      role: "admin",
    });

    if (memErr) {
      setError(memErr.message);
      setLoading(false);
      return;
    }

    window.location.href = "/skb-education-ecosystem/dashboard/";
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border shadow-xl p-8"
        style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold shadow-lg">
            SKB
          </div>
          <div>
            <div className="text-[16px] font-semibold">
              {step === 1 ? "Create account" : "Register institution"}
            </div>
            <div className="bangla text-[12px]" style={{ color: "var(--text-muted)" }}>
              {step === 1 ? "অ্যাকাউন্ট খুলুন" : "প্রতিষ্ঠান যোগ করুন"}
            </div>
          </div>
        </div>

        {step === 1 && (
          <form onSubmit={submitAccount} className="mt-6 space-y-4">
            <Field label="Full Name" value={form.full_name} onChange={(v) => update("full_name", v)} placeholder="Sakib Al Hasan" />
            <Field label="Email" type="email" value={form.email} onChange={(v) => update("email", v)} placeholder="you@school.edu.bd" />
            <Field label="Password" type="password" value={form.password} onChange={(v) => update("password", v)} placeholder="•••••••• (min 6 chars)" />

            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-[13px] text-rose-700">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 py-3 text-[14px] font-semibold text-white shadow-lg shadow-emerald-500/20 disabled:opacity-60">
              {loading ? "Creating..." : "Continue →"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={submitInstitution} className="mt-6 space-y-4">
            <div className="rounded-xl bg-emerald-500/10 p-3 text-[12px] text-emerald-700">
              ✅ Account created. এখন আপনার প্রতিষ্ঠান যোগ করুন।
            </div>
            <Field label="Institution Name" value={form.institution_name} onChange={(v) => update("institution_name", v)} placeholder="Dhaka Ideal School" />
            <Field label="URL slug" value={form.institution_slug} onChange={(v) => update("institution_slug", v)} placeholder="dhaka-ideal-school" />
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Type</label>
              <select
                value={form.institution_type}
                onChange={(e) => update("institution_type", e.target.value)}
                className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <option value="high_school">🏫 High School</option>
                <option value="college">🎓 College (HSC)</option>
                <option value="public_university">🏛️ Public University</option>
                <option value="private_university">🏛️ Private University</option>
                <option value="polytechnic">⚙️ Polytechnic</option>
                <option value="medical_college">⚕️ Medical College</option>
                <option value="coaching">📚 Coaching Center</option>
                <option value="madrasa">🕌 Madrasa</option>
                <option value="other">⭐ Other</option>
              </select>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-[13px] text-rose-700">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 py-3 text-[14px] font-semibold text-white shadow-lg shadow-emerald-500/20 disabled:opacity-60">
              {loading ? "Creating..." : "Finish setup →"}
            </button>
          </form>
        )}

        <div className="mt-5 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-emerald-700 dark:text-emerald-300">
            Sign in →
          </Link>
        </div>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>
        {label}
      </label>
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-emerald-500/30"
        style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}
      />
    </div>
  );
}
