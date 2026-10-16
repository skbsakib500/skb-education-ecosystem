"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { getGroupedTypes, getInstitutionMeta } from "@/lib/institution-types";
import { DIVISIONS, getDistricts } from "@/lib/bangladesh-data";
import { getGroupedBoards } from "@/lib/education-boards";

export default function Page() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>}><EditView /></Suspense>;
}

function EditView() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = searchParams.get("slug");
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [instId, setInstId] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");

  const [form, setForm] = useState({
    name: "", type: "high_school", emoji: "🏫",
    division: "dhaka", city: "", education_board: "dhaka_board",
    contact_phone: "", contact_email: "", description: "", motto: "",
    established_year: new Date().getFullYear(),
  });

  useEffect(() => {
    if (!authLoading && !user) router.push("/login/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !slug) return;
    (async () => {
      const { data: inst } = await supabase.from("institutions").select("*").eq("slug", slug).maybeSingle();
      if (!inst) { router.push("/dashboard/"); return; }
      const { data: mem } = await supabase.from("memberships").select("role")
        .eq("institution_id", inst.id).eq("user_id", user.id).maybeSingle();
      if (mem?.role !== "admin") { router.push("/dashboard/"); return; }

      setIsAdmin(true);
      setInstId(inst.id);
      setForm({
        name: inst.name, type: inst.type, emoji: inst.emoji || "🏫",
        division: inst.division || "dhaka", city: inst.city || "",
        education_board: inst.education_board || "dhaka_board",
        contact_phone: inst.contact_phone || "", contact_email: inst.contact_email || "",
        description: inst.description || "", motto: inst.motto || "",
        established_year: inst.established_year || new Date().getFullYear(),
      });
      if (inst.logo_url) setLogoPreview(inst.logo_url);
      setLoading(false);
    })();
  }, [user, slug, router]);

  const onLogoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { setError("Logo max 2 MB"); return; }
    setLogoFile(f);
    setLogoPreview(URL.createObjectURL(f));
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return null;
    const ext = (logoFile.name.split(".").pop() || "png").toLowerCase();
    const path = `${instId}/logo.${ext}`;
    const { error } = await supabase.storage.from("institution-logos").upload(path, logoFile, {
      upsert: true, contentType: logoFile.type,
    });
    if (error) { setError(error.message); return null; }
    const { data } = supabase.storage.from("institution-logos").getPublicUrl(path);
    return data.publicUrl;
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setSaving(true); setError(""); setOk("");

    // Upload logo first if changed
    if (logoFile) {
      const url = await uploadLogo();
      if (url) {
        await supabase.from("institutions").update({ logo_url: url }).eq("id", instId);
      }
    }

    const { error } = await supabase.rpc("update_institution", {
      p_institution_id: instId,
      p_name: form.name,
      p_type: form.type,
      p_emoji: form.emoji,
      p_division: form.division,
      p_city: form.city,
      p_education_board: form.education_board,
      p_contact_phone: form.contact_phone,
      p_contact_email: form.contact_email,
      p_description: form.description,
      p_motto: form.motto,
      p_established_year: form.established_year,
    });

    setSaving(false);
    if (error) { setError(error.message); return; }
    setOk("✅ Institution updated!");
    setTimeout(() => setOk(""), 2000);
    setTimeout(() => router.push("/institutions/view/?slug=" + slug), 2200);
  };

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>;
  }

  const groupedTypes = getGroupedTypes();
  const groupedBoards = getGroupedBoards();
  const districts = getDistricts(form.division);
  const meta = getInstitutionMeta(form.type);

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 border-b"
        style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 md:px-8">
          <Link href={"/institutions/view/?slug=" + slug} className="text-[13px]" style={{ color: "var(--text-muted)" }}>← Institution</Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 md:px-8 pt-8">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-6 text-white">
          <h1 className="text-[24px] font-semibold">Edit Institution</h1>
          <p className="bangla text-[13px] mt-1 text-emerald-50/90">প্রতিষ্ঠানের তথ্য পরিবর্তন করুন</p>
        </div>

        <form onSubmit={save} className="mt-6 rounded-2xl border p-6 space-y-5"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>

          {/* Logo */}
          <div className="flex items-center gap-5">
            <button type="button" onClick={() => fileRef.current?.click()}
              className="flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-dashed overflow-hidden text-[36px]"
              style={{ borderColor: "var(--border-strong)", background: "var(--bg-soft)" }}>
              {logoPreview ? <img src={logoPreview} alt="" className="h-full w-full object-cover" /> : form.emoji}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={onLogoPick} className="hidden" />
            <button type="button" onClick={() => fileRef.current?.click()}
              className="text-[12px] font-medium text-emerald-700">Change logo</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Institution Name *</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>

            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                {groupedTypes.map((g) => (
                  <optgroup key={g.category} label={g.meta.emoji + " " + g.meta.label}>
                    {g.items.map((t) => <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Board</label>
              <select value={form.education_board} onChange={(e) => setForm({ ...form, education_board: e.target.value })}
                className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                {groupedBoards.map((g) => (
                  <optgroup key={g.category} label={g.meta.emoji + " " + g.meta.label}>
                    {g.items.map((b) => <option key={b.value} value={b.value}>{b.emoji} {b.label}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Division</label>
              <select value={form.division} onChange={(e) => setForm({ ...form, division: e.target.value })}
                className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                {DIVISIONS.map((d) => <option key={d.value} value={d.value}>{d.label} · {d.bn}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>City</label>
              <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Mirpur, Dhaka"
                className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>

            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Phone</label>
              <input type="tel" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>

            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Email</label>
              <input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>

            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Motto</label>
              <input type="text" value={form.motto} onChange={(e) => setForm({ ...form, motto: e.target.value })}
                className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>

            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Established</label>
              <input type="number" value={form.established_year}
                onChange={(e) => setForm({ ...form, established_year: parseInt(e.target.value) || 2000 })}
                min="1800" max={new Date().getFullYear()}
                className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>
          </div>

          <div>
            <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3} className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none resize-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
          </div>

          {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-[13px] text-rose-700">{error}</div>}
          {ok && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-[13px] text-emerald-700">{ok}</div>}

          <button type="submit" disabled={saving}
            className="w-full rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 py-3 text-[14px] font-semibold text-white shadow disabled:opacity-50">
            {saving ? "Saving..." : "💾 Save Changes"}
          </button>
        </form>
      </div>
    </main>
  );
}
