"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export default function NewInstitutionPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    slug: "",
    type: "school",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login/");
  }, [user, authLoading, router]);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError("");

    const slug = form.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-+|-+$/g, "");

    const { data: inst, error: instErr } = await supabase
      .from("institutions")
      .insert({
        name: form.name.trim(),
        slug,
        type: form.type,
        owner_email: user.email ?? "",
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
      user_id: user.id,
      role: "admin",
    });

    if (memErr) {
      setError(memErr.message);
      setLoading(false);
      return;
    }

    window.location.href = "/skb-education-ecosystem/dashboard/";
  };

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border shadow-xl p-8"
        style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold shadow-lg">
            +
          </div>
          <div>
            <div className="text-[16px] font-semibold">Create Institution</div>
            <div className="bangla text-[12px]" style={{ color: "var(--text-muted)" }}>
              প্রতিষ্ঠান যোগ করুন
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label="Institution Name" value={form.name} onChange={(v) => update("name", v)} placeholder="Dhaka Ideal School" />

          <Field label="URL slug (unique)" value={form.slug} onChange={(v) => update("slug", v)} placeholder="dhaka-ideal-school" />

          <div>
            <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Type</label>
            <select
              value={form.type}
              onChange={(e) => update("type", e.target.value)}
              className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <option value="school">School</option>
              <option value="college">College</option>
              <option value="coaching">Coaching Center</option>
              <option value="madrasa">Madrasa</option>
              <option value="other">Other</option>
            </select>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-[13px] text-rose-700">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 py-3 text-[14px] font-semibold text-white shadow-lg shadow-emerald-500/20 disabled:opacity-60">
            {loading ? "Creating..." : "Create Institution →"}
          </button>
        </form>

        <div className="mt-5 text-center">
          <Link href="/dashboard" className="text-[12px]" style={{ color: "var(--text-faint)" }}>
            ← Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>
        {label}
      </label>
      <input
        type="text"
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
