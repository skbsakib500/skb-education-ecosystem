"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

const SUBJECTS = ["Physics","Chemistry","Biology","Math","English","Bangla","ICT","Accounting","Economics","Arabic"];
const LEVELS = ["Class 1-5","Class 6-8","Class 9-10","Class 11-12","University","Admission"];
const DIVISIONS = ["Dhaka","Chittagong","Rajshahi","Khulna","Barishal","Sylhet","Rangpur","Mymensingh"];

export default function BecomeTutorPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const [form, setForm] = useState({
    headline: "", bio: "",
    subjects: [] as string[], levels: [] as string[],
    hourly_rate_bdt: 500, negotiable: true,
    mode: "both", division: "Dhaka", city: "",
    experience_years: 0, education: "",
  });

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login/"); return; }
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("tutor_profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        setForm({
          headline: data.headline || "",
          bio: data.bio || "",
          subjects: data.subjects || [],
          levels: data.levels || [],
          hourly_rate_bdt: Number(data.hourly_rate_bdt) || 500,
          negotiable: data.negotiable ?? true,
          mode: data.mode || "both",
          division: data.division || "Dhaka",
          city: data.city || "",
          experience_years: data.experience_years || 0,
          education: data.education || "",
        });
      }
      setLoading(false);
    })();
  }, [user, authLoading, router]);

  const toggle = (key: "subjects" | "levels", v: string) => {
    setForm((f) => ({ ...f, [key]: f[key].includes(v) ? f[key].filter((x) => x !== v) : [...f[key], v] }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true); setError(""); setOk("");
    const { error } = await supabase.from("tutor_profiles").upsert({
      user_id: user.id,
      headline: form.headline.trim() || null,
      bio: form.bio.trim() || null,
      subjects: form.subjects,
      levels: form.levels,
      hourly_rate_bdt: form.hourly_rate_bdt,
      negotiable: form.negotiable,
      mode: form.mode,
      division: form.division,
      city: form.city.trim() || null,
      experience_years: form.experience_years,
      education: form.education.trim() || null,
      is_active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    setSaving(false);
    if (error) { setError(error.message); return; }
    setOk("✅ Tutor profile saved!");
    setTimeout(() => router.push("/tutors/"), 1500);
  };

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>;
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/tutors" className="text-[13px]" style={{ color: "var(--text-muted)" }}>← Tutors</Link>

        <div className="mt-4 rounded-3xl border p-6 md:p-8" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <h1 className="text-[24px] font-semibold">🎓 Become a Tutor</h1>
          <p className="bangla text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>
            আপনার প্রোফাইল তৈরি করুন — ছাত্র/অভিভাবক আপনাকে খুঁজে পাবে
          </p>

          <form onSubmit={submit} className="mt-6 space-y-5">
            <Field label="Headline" value={form.headline} onChange={(v) => setForm({ ...form, headline: v })} placeholder="Physics & Math Tutor for Class 9-12" />
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Bio</label>
              <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={3} placeholder="আপনার পড়ানোর স্টাইল, অভিজ্ঞতা..."
                className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[13px] outline-none resize-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>

            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Subjects</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {SUBJECTS.map((s) => (
                  <button key={s} type="button" onClick={() => toggle("subjects", s)}
                    className={"rounded-full border px-3 py-1.5 text-[11px] font-medium " + (form.subjects.includes(s) ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700" : "")}
                    style={!form.subjects.includes(s) ? { borderColor: "var(--border)" } : {}}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Levels</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {LEVELS.map((s) => (
                  <button key={s} type="button" onClick={() => toggle("levels", s)}
                    className={"rounded-full border px-3 py-1.5 text-[11px] font-medium " + (form.levels.includes(s) ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700" : "")}
                    style={!form.levels.includes(s) ? { borderColor: "var(--border)" } : {}}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Hourly Rate (৳)</label>
                <input type="number" min="0" value={form.hourly_rate_bdt}
                  onChange={(e) => setForm({ ...form, hourly_rate_bdt: parseInt(e.target.value) || 0 })}
                  className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[13px] outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
              </div>
              <div>
                <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Experience (years)</label>
                <input type="number" min="0" value={form.experience_years}
                  onChange={(e) => setForm({ ...form, experience_years: parseInt(e.target.value) || 0 })}
                  className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[13px] outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Mode</label>
                <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}
                  className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[13px] outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div>
                <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Division</label>
                <select value={form.division} onChange={(e) => setForm({ ...form, division: e.target.value })}
                  className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[13px] outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                  {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} placeholder="Mirpur, Dhanmondi..." />
            <Field label="Education" value={form.education} onChange={(v) => setForm({ ...form, education: v })} placeholder="BSc in Physics, DU" />

            {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-[12px] text-rose-700">{error}</div>}
            {ok && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-[12px] text-emerald-700">{ok}</div>}

            <button type="submit" disabled={saving}
              className="w-full rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 py-3 text-[14px] font-semibold text-white shadow disabled:opacity-50">
              {saving ? "Saving..." : "💾 Save Tutor Profile"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, placeholder }: any) {
  return (
    <div>
      <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[13px] outline-none"
        style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
    </div>
  );
}
