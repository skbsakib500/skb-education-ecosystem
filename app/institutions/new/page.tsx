"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { getGroupedTypes, getInstitutionMeta, INSTITUTION_TYPES } from "@/lib/institution-types";
import { DIVISIONS, getDistricts, getDivisionMeta, getDistrictMeta } from "@/lib/bangladesh-data";
import { getGroupedBoards, getBoardMeta, EDUCATION_BOARDS } from "@/lib/education-boards";
import PremiumSelect from "@/components/PremiumSelect";

const RESERVED = ["admin","api","app","login","signup","dashboard","www","new","edit"];
const EMOJIS = ["🏫","🎓","🏛️","⚕️","⚙️","🕌","📚","🔧","🎨","🤝","⭐","🎯","💡","🔬","🌐"];

function slugify(input: string): string {
  return input.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-")
    .replace(/-+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export default function NewInstitutionPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    type: "high_school",
    emoji: "🏫",
    division: "dhaka",
    district: "dhaka",
    city: "",
    education_board: "dhaka_board",
    contact_phone: "",
    contact_email: "",
    description: "",
    motto: "",
    established_year: new Date().getFullYear(),
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [slugError, setSlugError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!slugTouched && form.name) {
      setForm((f) => ({ ...f, slug: slugify(form.name) }));
    }
  }, [form.name, slugTouched]);

  useEffect(() => {
    const meta = getInstitutionMeta(form.type);
    if (meta.emoji) setForm((f) => ({ ...f, emoji: meta.emoji }));
  }, [form.type]);

  useEffect(() => {
    const slug = form.slug;
    if (!slug) { setSlugStatus("idle"); setSlugError(""); return; }
    if (slug.length < 3) { setSlugStatus("invalid"); setSlugError("Must be at least 3 characters"); return; }
    if (RESERVED.includes(slug)) { setSlugStatus("invalid"); setSlugError(`"${slug}" is reserved`); return; }
    setSlugStatus("checking");
    const timer = setTimeout(async () => {
      const { data } = await supabase.from("institutions").select("id").eq("slug", slug).maybeSingle();
      if (data) { setSlugStatus("taken"); setSlugError("Already taken"); }
      else { setSlugStatus("available"); setSlugError(""); }
    }, 500);
    return () => clearTimeout(timer);
  }, [form.slug]);

  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const onDivisionChange = (div: string) => {
    const districts = getDistricts(div);
    setForm((f) => ({ ...f, division: div, district: districts[0]?.value ?? "" }));
  };

  const onLogoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError("Logo max 2 MB"); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const uploadLogo = async (institutionId: string): Promise<string | null> => {
    if (!logoFile) return null;
    const ext = (logoFile.name.split(".").pop() || "png").toLowerCase();
    const path = `${institutionId}/logo.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("institution-logos")
      .upload(path, logoFile, { upsert: true, contentType: logoFile.type });
    if (upErr) { setError(`Logo upload failed: ${upErr.message}`); return null; }
    const { data } = supabase.storage.from("institution-logos").getPublicUrl(path);
    return data.publicUrl;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (slugStatus !== "available") { setError("Choose an available slug first"); return; }
    setLoading(true); setError("");

    // Step 1: Create institution (без logo)
    const { data: inst, error: instErr } = await supabase.from("institutions").insert({
      name: form.name.trim(),
      slug: form.slug,
      type: form.type,
      owner_email: user.email ?? "",
      logo_url: null,
      emoji: form.emoji,
      division: form.division,
      city: form.city.trim() || form.district,
      education_board: form.education_board,
      contact_phone: form.contact_phone.trim() || null,
      contact_email: form.contact_email.trim() || null,
      description: form.description.trim() || null,
      motto: form.motto.trim() || null,
      established_year: form.established_year,
    }).select().single();

    if (instErr) { setError(instErr.message); setLoading(false); return; }

    // Step 2: Membership (admin role)
    const { error: memErr } = await supabase.from("memberships").insert({
      institution_id: inst.id, user_id: user.id, role: "admin",
    });

    if (memErr) { setError(memErr.message); setLoading(false); return; }

    // Step 3: Logo upload (now user is admin → is_admin_of() passes)
    if (logoFile) {
      const logo_url = await uploadLogo(inst.id);
      if (logo_url) {
        await supabase.from("institutions").update({ logo_url }).eq("id", inst.id);
      }
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

  const groupedTypes = getGroupedTypes();
  const groupedBoards = getGroupedBoards();
  const districts = getDistricts(form.division);
  const meta = getInstitutionMeta(form.type);
  const boardMeta = getBoardMeta(form.education_board);
  const divisionMeta = getDivisionMeta(form.division);
  const districtMeta = getDistrictMeta(form.division, form.district);
  const finalUrl = `skb.edu.bd/${form.slug || "your-institution"}`;

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">

        {/* ── FORM ── */}
        <div className="rounded-3xl border p-6 md:p-8 shadow-xl"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold shadow-lg">+</div>
            <div>
              <div className="text-[16px] font-semibold">Create Institution</div>
              <div className="bangla text-[12px]" style={{ color: "var(--text-muted)" }}>প্রতিষ্ঠান যোগ করুন</div>
            </div>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-5">

            {/* Type — categorized */}
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>
                Institution Type *
              </label>
              <PremiumSelect value={form.type} onChange={(v) => update("type", v)}
                  options={groupedTypes} placeholder="Select institution type" />
              <p className="mt-1 text-[11px]" style={{ color: "var(--text-faint)" }}>
                {groupedTypes.length} categories • {INSTITUTION_TYPES.length} types
              </p>
            </div>

            {/* Logo + Name */}
            <div className="grid grid-cols-[100px_1fr] gap-4 items-start">
              <div>
                <label className="text-[12px] font-medium block mb-1" style={{ color: "var(--text-muted)" }}>Logo</label>
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="flex h-[100px] w-[100px] items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition hover:border-emerald-500/50"
                  style={{ borderColor: "var(--border-strong)", background: "var(--bg-soft)" }}>
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    <div className="text-center px-2" style={{ color: "var(--text-muted)" }}>
                      <div className="text-[28px]">{form.emoji}</div>
                      <div className="mt-1 text-[10px]">Upload</div>
                    </div>
                  )}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={onLogoPick} className="hidden" />
              </div>

              <div>
                <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Institution Name *</label>
                <input type="text" required value={form.name} onChange={(e) => update("name", e.target.value)}
                  placeholder="Dhaka Polytechnic Institute"
                  className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-emerald-500/30"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {EMOJIS.slice(0, 12).map((em) => (
                    <button key={em} type="button" onClick={() => update("emoji", em)}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-[14px] transition ${
                        form.emoji === em ? "bg-emerald-500/20 ring-2 ring-emerald-500/40" : "hover:bg-[var(--bg-soft)]"
                      }`}>{em}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Slug */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>URL slug *</label>
                <SlugBadge status={slugStatus} />
              </div>
              <div className="mt-1 flex items-center gap-2 rounded-xl border px-3.5 py-2.5"
                style={{
                  borderColor: slugStatus === "taken" || slugStatus === "invalid" ? "rgba(244,63,94,0.5)"
                    : slugStatus === "available" ? "rgba(16,185,129,0.5)" : "var(--border)",
                  background: "var(--surface-3)",
                }}>
                <span className="text-[12px] font-mono" style={{ color: "var(--text-faint)" }}>skb.edu.bd/</span>
                <input type="text" required value={form.slug}
                  onChange={(e) => { setSlugTouched(true); update("slug", slugify(e.target.value)); }}
                  placeholder="dhaka-polytechnic"
                  className="flex-1 bg-transparent text-[14px] outline-none font-mono" />
              </div>
              {slugError ? (
                <p className="mt-1 text-[11px] text-rose-600">{slugError}</p>
              ) : (
                <p className="mt-1 text-[11px]" style={{ color: "var(--text-faint)" }}>small letters, numbers, hyphen • 3-40 chars</p>
              )}
            </div>

            {/* Division → District (cascading) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Division *</label>
                <PremiumSelect value={form.division} onChange={onDivisionChange}
                  options={DIVISIONS.map((d) => ({ value: d.value, label: d.label, bn: d.bn }))}
                  placeholder="Select division" searchable={false} />
              </div>
              <div>
                <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>District *</label>
                <PremiumSelect value={form.district} onChange={(v) => update("district", v)}
                  options={districts.map((d) => ({ value: d.value, label: d.label, bn: d.bn }))}
                  placeholder="Select district" />
              </div>
            </div>

            {/* City / Area */}
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>City / Area (optional)</label>
              <input type="text" value={form.city} onChange={(e) => update("city", e.target.value)}
                placeholder="Mirpur, Dhanmondi, Banani..."
                className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-emerald-500/30"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
              <p className="mt-1 text-[11px]" style={{ color: "var(--text-faint)" }}>
                খালি রাখলে district-এর নাম দেখাবে
              </p>
            </div>

            {/* Education Board — categorized */}
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>
                Education Board / Affiliation *
              </label>
              <PremiumSelect value={form.education_board} onChange={(v) => update("education_board", v)}
                  options={groupedBoards} placeholder="Select education board" />
              <p className="mt-1 text-[11px]" style={{ color: "var(--text-faint)" }}>
                {groupedBoards.length} categories • {EDUCATION_BOARDS.length} boards
              </p>
            </div>

            {/* Advanced toggle */}
            <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-[12px] font-medium text-emerald-700 dark:text-emerald-300">
              {showAdvanced ? "− Hide advanced fields" : "+ Add contact, description, motto"}
            </button>

            {showAdvanced && (
              <div className="space-y-5 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Phone</label>
                    <input type="tel" value={form.contact_phone} onChange={(e) => update("contact_phone", e.target.value)}
                      placeholder="+880 1700-000000"
                      className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none"
                      style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Email</label>
                    <input type="email" value={form.contact_email} onChange={(e) => update("contact_email", e.target.value)}
                      placeholder="info@institution.edu.bd"
                      className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none"
                      style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-4">
                  <div>
                    <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Motto / Tagline</label>
                    <input type="text" value={form.motto} onChange={(e) => update("motto", e.target.value)}
                      placeholder="Education for Excellence"
                      className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none"
                      style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Established</label>
                    <input type="number" value={form.established_year}
                      onChange={(e) => update("established_year", parseInt(e.target.value) || new Date().getFullYear())}
                      min="1800" max={new Date().getFullYear()}
                      className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none"
                      style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
                  </div>
                </div>

                <div>
                  <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Description</label>
                  <textarea value={form.description} onChange={(e) => update("description", e.target.value)}
                    placeholder="প্রতিষ্ঠান সম্পর্কে সংক্ষিপ্ত বিবরণ..."
                    rows={3}
                    className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none resize-none"
                    style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-[13px] text-rose-700">{error}</div>
            )}

            <button type="submit" disabled={loading || slugStatus !== "available"}
              className="w-full rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 py-3 text-[14px] font-semibold text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "Creating..." : "Create Institution →"}
            </button>
          </form>

          <div className="mt-5 text-center">
            <Link href="/dashboard" className="text-[12px]" style={{ color: "var(--text-faint)" }}>← Back to dashboard</Link>
          </div>
        </div>

        {/* ── PREVIEW ── */}
        <div className="lg:sticky lg:top-8 self-start">
          <div className="text-[11px] uppercase font-semibold tracking-widest mb-3" style={{ color: "var(--text-faint)" }}>
            Live Preview
          </div>

          <div className="overflow-hidden rounded-2xl border shadow-lg"
            style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            <div className="h-20 bg-gradient-to-br from-emerald-500 to-teal-600 relative">
              <div className="absolute -bottom-8 left-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 text-[28px]"
                  style={{ borderColor: "var(--surface-3)", background: "white" }}>
                  {logoPreview ? <img src={logoPreview} alt="" className="h-full w-full rounded-xl object-cover" /> : form.emoji}
                </div>
              </div>
            </div>
            <div className="px-5 pb-5 pt-12">
              <div className="text-[17px] font-semibold">{form.name || "Your Institution Name"}</div>
              {form.motto && (
                <div className="text-[12px] italic mt-0.5" style={{ color: "var(--text-muted)" }}>"{form.motto}"</div>
              )}
              <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-700 font-medium">
                  {meta.emoji} {meta.label}
                </span>
                {districtMeta && (
                  <span className="rounded-full px-2 py-0.5 font-medium" style={{ background: "var(--bg-soft)", color: "var(--text-muted)" }}>
                    📍 {districtMeta.label}, {divisionMeta?.label}
                  </span>
                )}
                {form.established_year && (
                  <span className="rounded-full px-2 py-0.5 font-medium" style={{ background: "var(--bg-soft)", color: "var(--text-muted)" }}>
                    Est. {form.established_year}
                  </span>
                )}
              </div>
              <div className="mt-2">
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{ background: "var(--bg-soft)", color: "var(--text-muted)" }}>
                  {boardMeta.emoji} {boardMeta.label}
                </span>
              </div>
              {form.description && (
                <p className="mt-3 text-[12px] leading-relaxed line-clamp-2" style={{ color: "var(--text-muted)" }}>{form.description}</p>
              )}
              {(form.contact_phone || form.contact_email) && (
                <div className="mt-3 pt-3 border-t text-[11px] space-y-0.5"
                  style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                  {form.contact_phone && <div>📞 {form.contact_phone}</div>}
                  {form.contact_email && <div>✉️ {form.contact_email}</div>}
                </div>
              )}
            </div>
            <div className="border-t px-5 py-3 text-[11px] font-mono"
              style={{ borderColor: "var(--border)", background: "var(--bg-soft)", color: "var(--text-faint)" }}>
              {finalUrl}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border p-4"
            style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            <div className="text-[12px] font-semibold mb-2">Setup Checklist</div>
            <div className="space-y-1.5 text-[12px]">
              <Check ok={form.name.length > 2} label="Institution name" />
              <Check ok={slugStatus === "available"} label="Unique URL slug" />
              <Check ok={!!form.type} label="Type selected" />
              <Check ok={!!form.division && !!form.district} label="Division & district" />
              <Check ok={!!form.education_board} label="Board selected" />
              <Check ok={!!logoPreview} label="Logo uploaded" optional />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Check({ ok, label, optional }: { ok: boolean; label: string; optional?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
        style={ok ? { background: "#10b981", color: "white" } : { border: "1px solid var(--border-strong)", color: "var(--text-faint)" }}>
        {ok ? "✓" : ""}
      </div>
      <span style={ok ? {} : { color: "var(--text-muted)" }}>
        {label} {optional && <span style={{ color: "var(--text-faint)" }}>(optional)</span>}
      </span>
    </div>
  );
}

function SlugBadge({ status }: { status: SlugStatus }) {
  if (status === "idle") return null;
  const map: Record<Exclude<SlugStatus, "idle">, { text: string; cls: string }> = {
    checking: { text: "⏳ Checking...", cls: "bg-slate-500/10 text-slate-600" },
    available: { text: "✓ Available", cls: "bg-emerald-500/15 text-emerald-700" },
    taken: { text: "✕ Taken", cls: "bg-rose-500/15 text-rose-700" },
    invalid: { text: "⚠ Invalid", cls: "bg-amber-500/15 text-amber-700" },
  };
  const v = map[status];
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${v.cls}`}>{v.text}</span>;
}
