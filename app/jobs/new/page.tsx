"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

const ROLE_TYPES = ["teacher","tutor","admin","accountant","librarian","receptionist","other"];
const EMP_TYPES = ["full_time","part_time","contract","internship"];

export default function NewJobPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [insts, setInsts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    institution_id: "", title: "", description: "",
    role_type: "teacher", employment_type: "full_time",
    experience_min: 0, salary_min: 0, salary_max: 0,
    location: "", division: "", city: "",
    application_deadline: "",
  });

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login/"); return; }
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("memberships").select("institution_id, role, institutions:institution_id(id, name)")
        .eq("user_id", user.id).eq("role", "admin");
      setInsts(data ?? []);
      setLoading(false);
    })();
  }, [user, authLoading, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true); setError("");
    const { error } = await supabase.from("job_postings").insert({
      institution_id: form.institution_id || null,
      posted_by: user.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      role_type: form.role_type,
      employment_type: form.employment_type,
      experience_min: form.experience_min,
      salary_min: form.salary_min || null,
      salary_max: form.salary_max || null,
      location: form.location.trim() || null,
      division: form.division || null,
      city: form.city.trim() || null,
      application_deadline: form.application_deadline || null,
      status: "open",
    });
    setSaving(false);
    if (error) { setError(error.message); return; }
    router.push("/jobs/");
  };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>;

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/jobs" className="text-[13px]" style={{ color: "var(--text-muted)" }}>← Jobs</Link>
        <div className="mt-4 rounded-3xl border p-6 md:p-8" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <h1 className="text-[24px] font-semibold">💼 Post a Job</h1>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="text-fluid-caption font-medium" style={{ color: "var(--text-muted)" }}>Institution (optional)</label>
              <select value={form.institution_id} onChange={(e) => setForm({ ...form, institution_id: e.target.value })}
                className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[13px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <option value="">Independent posting</option>
                {insts.map((i) => <option key={i.institution_id} value={i.institution_id}>{i.institutions?.name}</option>)}
              </select>
            </div>
            <Field label="Job Title *" value={form.title} onChange={(v: string) => setForm({ ...form, title: v })} placeholder="Senior Physics Teacher" required />
            <div>
              <label className="text-fluid-caption font-medium" style={{ color: "var(--text-muted)" }}>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4} className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[13px] outline-none resize-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-fluid-caption font-medium" style={{ color: "var(--text-muted)" }}>Role Type</label>
                <select value={form.role_type} onChange={(e) => setForm({ ...form, role_type: e.target.value })}
                  className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[13px] outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                  {ROLE_TYPES.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-fluid-caption font-medium" style={{ color: "var(--text-muted)" }}>Employment</label>
                <select value={form.employment_type} onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
                  className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[13px] outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                  {EMP_TYPES.map((r) => <option key={r} value={r} className="capitalize">{r.replace("_", " ")}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-fluid-caption font-medium" style={{ color: "var(--text-muted)" }}>Salary Min (৳)</label>
                <input type="number" min="0" value={form.salary_min} onChange={(e) => setForm({ ...form, salary_min: parseInt(e.target.value) || 0 })}
                  className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[13px] outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
              </div>
              <div>
                <label className="text-fluid-caption font-medium" style={{ color: "var(--text-muted)" }}>Salary Max (৳)</label>
                <input type="number" min="0" value={form.salary_max} onChange={(e) => setForm({ ...form, salary_max: parseInt(e.target.value) || 0 })}
                  className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[13px] outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
              </div>
            </div>
            <Field label="Location" value={form.location} onChange={(v: string) => setForm({ ...form, location: v })} placeholder="Mirpur, Dhaka" />
            {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-fluid-caption text-rose-700">{error}</div>}
            <button type="submit" disabled={saving}
              className="w-full rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 py-3 text-[14px] font-semibold text-white shadow disabled:opacity-50">
              {saving ? "Posting..." : "Post Job →"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, placeholder, required }: any) {
  return (
    <div>
      <label className="text-fluid-caption font-medium" style={{ color: "var(--text-muted)" }}>{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required}
        className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[13px] outline-none"
        style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
    </div>
  );
}
