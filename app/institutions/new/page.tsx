"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

const RESERVED = ["admin", "api", "app", "login", "signup", "dashboard", "www", "new", "edit"];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export default function NewInstitutionPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", slug: "", type: "school" });
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [slugError, setSlugError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login/");
  }, [user, authLoading, router]);

  // Auto-generate slug from name (only if user hasn't manually edited)
  useEffect(() => {
    if (!slugTouched && form.name) {
      setForm((f) => ({ ...f, slug: slugify(form.name) }));
    }
  }, [form.name, slugTouched]);

  // Live slug validation
  useEffect(() => {
    const slug = form.slug;
    if (!slug) {
      setSlugStatus("idle");
      setSlugError("");
      return;
    }
    if (slug.length < 3) {
      setSlugStatus("invalid");
      setSlugError("Must be at least 3 characters");
      return;
    }
    if (RESERVED.includes(slug)) {
      setSlugStatus("invalid");
      setSlugError(`"${slug}" reserved — choose another`);
      return;
    }
    setSlugStatus("checking");
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("institutions")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (data) {
        setSlugStatus("taken");
        setSlugError("Already taken — try another");
      } else {
        setSlugStatus("available");
        setSlugError("");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [form.slug]);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (slugStatus !== "available") {
      setError("Please choose an available slug first");
      return;
    }
    setLoading(true);
    setError("");

    const { data: inst, error: instErr } = await supabase
      .from("institutions")
      .insert({
        name: form.name.trim(),
        slug: form.slug,
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

  const finalUrl = `skb.edu.bd/${form.slug || "your-institution"}`;

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg rounded-3xl border shadow-xl p-8"
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

        <form onSubmit={submit} className="mt-6 space-y-5">
          {/* Institution Name */}
          <div>
            <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>
              Institution Name
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Dhaka Ideal School"
              className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-emerald-500/30"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}
            />
            <p className="mt-1 text-[11px]" style={{ color: "var(--text-faint)" }}>
              আপনার প্রতিষ্ঠানের পুরো নাম • প্রতিষ্ঠানের নাম
            </p>
          </div>

          {/* Slug with validation */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>
                URL slug
              </label>
              <SlugBadge status={slugStatus} />
            </div>
            <div className="mt-1 flex items-center gap-2 rounded-xl border px-3.5 py-2.5"
              style={{
                borderColor:
                  slugStatus === "taken" || slugStatus === "invalid"
                    ? "rgba(244,63,94,0.5)"
                    : slugStatus === "available"
                    ? "rgba(16,185,129,0.5)"
                    : "var(--border)",
                background: "var(--surface-3)",
              }}>
              <span className="text-[12px] font-mono" style={{ color: "var(--text-faint)" }}>
                skb.edu.bd/
              </span>
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  update("slug", slugify(e.target.value));
                }}
                placeholder="dhaka-ideal-school"
                className="flex-1 bg-transparent text-[14px] outline-none font-mono"
              />
            </div>

            {/* Hint / Error */}
            {slugError ? (
              <p className="mt-1 text-[11px] text-rose-600">{slugError}</p>
            ) : (
              <p className="mt-1 text-[11px]" style={{ color: "var(--text-faint)" }}>
                শুধু small letters, numbers, hyphen (-) • 3-40 characters
              </p>
            )}

            {/* URL Preview */}
            <div className="mt-3 rounded-xl border border-dashed p-3"
              style={{ borderColor: "var(--border-strong)", background: "var(--bg-soft)" }}>
              <div className="text-[10px] uppercase tracking-wide font-semibold"
                style={{ color: "var(--text-faint)" }}>
                Your institution URL
              </div>
              <div className="mt-1 font-mono text-[13px] text-emerald-700 dark:text-emerald-300 break-all">
                {finalUrl}
              </div>
            </div>

            {/* Quick suggestions */}
            {form.name && !slugTouched && (
              <p className="mt-2 text-[11px]" style={{ color: "var(--text-faint)" }}>
                💡 Auto-generated from name. চাইলে edit করতে পারেন।
              </p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>
              Institution Type
            </label>
            <select
              value={form.type}
              onChange={(e) => update("type", e.target.value)}
              className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <option value="school">🏫 School</option>
              <option value="college">🎓 College</option>
              <option value="coaching">📚 Coaching Center</option>
              <option value="madrasa">🕌 Madrasa</option>
              <option value="other">🏛️ Other</option>
            </select>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-[13px] text-rose-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || slugStatus !== "available"}
            className="w-full rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 py-3 text-[14px] font-semibold text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
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

function SlugBadge({ status }: { status: SlugStatus }) {
  if (status === "idle") return null;
  const map: Record<Exclude<SlugStatus, "idle">, { text: string; cls: string }> = {
    checking: { text: "⏳ Checking...", cls: "bg-slate-500/10 text-slate-600" },
    available: { text: "✓ Available", cls: "bg-emerald-500/15 text-emerald-700" },
    taken: { text: "✕ Taken", cls: "bg-rose-500/15 text-rose-700" },
    invalid: { text: "⚠ Invalid", cls: "bg-amber-500/15 text-amber-700" },
  };
  const v = map[status];
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${v.cls}`}>
      {v.text}
    </span>
  );
}
