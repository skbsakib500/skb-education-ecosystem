"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export default function Page() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>}><AdmissionForm /></Suspense>;
}

function AdmissionForm() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get("school");

  const [inst, setInst] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<any>(null);

  const [form, setForm] = useState({
    applicant_name: "", applicant_dob: "", gender: "male",
    class_name: "", guardian_name: "", guardian_phone: "", guardian_email: "",
    guardian_relation: "father", address: "", previous_school: "", previous_class: "",
    blood_group: "", religion: "", quota: "",
  });

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login/?next=/admission/?school=" + slug); return; }
    if (!user || !slug) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase.from("institutions").select("id, name, slug, emoji, logo_url, motto").eq("slug", slug).maybeSingle();
      setInst(data);
      setLoading(false);
    })();
  }, [user, authLoading, router, slug]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inst) return;
    setSubmitting(true); setError("");
    const { data, error } = await supabase.rpc("submit_admission", {
      p_institution_id: inst.id,
      p_applicant_name: form.applicant_name,
      p_applicant_dob: form.applicant_dob || null,
      p_gender: form.gender,
      p_class_name: form.class_name,
      p_guardian_name: form.guardian_name,
      p_guardian_phone: form.guardian_phone,
      p_guardian_email: form.guardian_email || null,
      p_guardian_relation: form.guardian_relation,
      p_address: form.address || null,
      p_previous_school: form.previous_school || null,
      p_previous_class: form.previous_class || null,
      p_blood_group: form.blood_group || null,
      p_religion: form.religion || null,
      p_quota: form.quota || null,
      p_attachment_urls: [],
    });
    setSubmitting(false);
    if (error) { setError(error.message); return; }
    setSuccess(data);
  };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>;

  if (!slug || !inst) return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md rounded-3xl border p-8" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
        <div className="text-[48px]">🔍</div>
        <div className="mt-3 text-[16px] font-semibold">Institution not found</div>
        <div className="text-[13px] mt-2" style={{ color: "var(--text-muted)" }}>Check the admission link provided by your school</div>
      </div>
    </main>
  );

  if (success) return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border p-8 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
        <div className="text-[56px]">✅</div>
        <div className="mt-3 text-[18px] font-semibold">Application Submitted!</div>
        <div className="bangla text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>আবেদন সফলভাবে জমা হয়েছে</div>

        <div className="mt-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white">
          <div className="text-[12px] opacity-90">Application Number</div>
          <div className="text-[22px] font-bold font-mono mt-1">{success.application_no}</div>
        </div>

        <div className="mt-4 text-[12px]" style={{ color: "var(--text-muted)" }}>
          এই number দিয়ে application status track করুন
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <Link href={"/admission/track/?no=" + success.application_no}
            className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 py-2.5 text-[13px] font-semibold text-white shadow">
            Track Application →
          </Link>
          <Link href="/hub" className="rounded-full border py-2.5 text-[13px]" style={{ borderColor: "var(--border)" }}>Back to Hub</Link>
        </div>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/hub" className="text-[13px]" style={{ color: "var(--text-muted)" }}>← Hub</Link>

        <div className="mt-4 rounded-3xl border overflow-hidden" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="p-6 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur text-[26px] overflow-hidden">
                {inst.logo_url ? <img src={inst.logo_url} alt="" className="h-full w-full object-cover" /> : (inst.emoji || "🏫")}
              </div>
              <div>
                <div className="text-[18px] font-semibold">{inst.name}</div>
                {inst.motto && <div className="text-[12px] italic opacity-90">{inst.motto}</div>}
              </div>
            </div>
            <div className="mt-4 text-[14px] font-medium">📝 Admission Application</div>
          </div>

          <form onSubmit={submit} className="p-6 space-y-5">
            <Section title="Student Information" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name *" value={form.applicant_name} onChange={(v: string) => setForm({ ...form, applicant_name: v })} required />
              <div>
                <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Date of Birth</label>
                <input type="date" value={form.applicant_dob} onChange={(e) => setForm({ ...form, applicant_dob: e.target.value })}
                  className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[13px] outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
              </div>
              <div>
                <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Gender</label>
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[13px] outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <Field label="Class Applying For *" value={form.class_name} onChange={(v: string) => setForm({ ...form, class_name: v })} placeholder="Class 6 / HSC-1" required />
              <div>
                <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Blood Group</label>
                <input type="text" value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })} placeholder="A+"
                  className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[13px] outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
              </div>
              <Field label="Religion" value={form.religion} onChange={(v: string) => setForm({ ...form, religion: v })} placeholder="Islam / Hinduism" />
            </div>

            <Section title="Guardian Information" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Guardian Name *" value={form.guardian_name} onChange={(v: string) => setForm({ ...form, guardian_name: v })} required />
              <div>
                <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Relationship</label>
                <select value={form.guardian_relation} onChange={(e) => setForm({ ...form, guardian_relation: e.target.value })}
                  className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[13px] outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                  <option value="father">👨 Father</option>
                  <option value="mother">👩 Mother</option>
                  <option value="guardian">👤 Guardian</option>
                </select>
              </div>
              <Field label="Guardian Phone *" value={form.guardian_phone} onChange={(v: string) => setForm({ ...form, guardian_phone: v })} placeholder="+880 1700-000000" required />
              <Field label="Guardian Email" value={form.guardian_email} onChange={(v: string) => setForm({ ...form, guardian_email: v })} placeholder="parent@email.com" />
            </div>
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Address</label>
              <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} placeholder="Full address"
                className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[13px] outline-none resize-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>

            <Section title="Academic Background" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Previous School" value={form.previous_school} onChange={(v: string) => setForm({ ...form, previous_school: v })} placeholder="School name" />
              <Field label="Previous Class" value={form.previous_class} onChange={(v: string) => setForm({ ...form, previous_class: v })} placeholder="Class 5" />
            </div>

            {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-[12px] text-rose-700">{error}</div>}

            <button type="submit" disabled={submitting}
              className="w-full rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 py-3 text-[14px] font-semibold text-white shadow disabled:opacity-50">
              {submitting ? "Submitting..." : "📝 Submit Application"}
            </button>

            <div className="text-center text-[12px]" style={{ color: "var(--text-muted)" }}>
              Already applied? <Link href="/admission/track" className="font-medium text-emerald-700">Track status →</Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

function Section({ title }: { title: string }) {
  return (
    <div className="pt-2 border-t" style={{ borderColor: "var(--border)" }}>
      <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{title}</div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, required }: any) {
  return (
    <div>
      <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required}
        className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[13px] outline-none"
        style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
    </div>
  );
}
