"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    bio: "",
    address: "",
    date_of_birth: "",
    blood_group: "",
    avatar_url: "",
  });

  useEffect(() => {
    if (!authLoading && !user) router.push("/login/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (data) {
        setForm({
          full_name: data.full_name ?? "",
          phone: data.phone ?? "",
          bio: data.bio ?? "",
          address: data.address ?? "",
          date_of_birth: data.date_of_birth ?? "",
          blood_group: data.blood_group ?? "",
          avatar_url: data.avatar_url ?? "",
        });
        if (data.avatar_url) setAvatarPreview(data.avatar_url);
      }
      setLoading(false);
    })();
  }, [user]);

  const onAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { setError("Avatar max 2 MB"); return; }
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return form.avatar_url || null;
    const ext = (avatarFile.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, avatarFile, {
      upsert: true, contentType: avatarFile.type,
    });
    if (error) { setError(error.message); return null; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(""); setOk("");

    const avatar_url = await uploadAvatar();
    if (avatarFile && !avatar_url) { setSaving(false); return; }

    const { error } = await supabase.rpc("update_my_profile", {
      p_full_name: form.full_name.trim(),
      p_phone: form.phone.trim() || null,
      p_bio: form.bio.trim() || null,
      p_address: form.address.trim() || null,
      p_dob: form.date_of_birth || null,
      p_blood_group: form.blood_group || null,
      p_avatar_url: avatar_url,
    });

    setSaving(false);
    if (error) { setError(error.message); return; }
    setOk("✅ Profile updated!");
    setTimeout(() => setOk(""), 2500);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  const initials = (form.full_name || user?.email || "U").slice(0, 2).toUpperCase();

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 border-b"
        style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 md:px-8">
          <Link href="/hub" className="flex items-center gap-2 text-[13px]" style={{ color: "var(--text-muted)" }}>← Hub</Link>
          <Link href="/settings/privacy/"
            className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] font-medium"
            style={{ borderColor: "var(--border)" }}>
            <Shield size={13} /> Privacy
          </Link>
          <button onClick={signOut} className="rounded-full border px-3.5 py-1.5 text-[12px]"
            style={{ borderColor: "var(--border)" }}>Sign out</button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 md:px-8 pt-8">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-6 md:p-8 text-white">
          <h1 className="text-[24px] md:text-[28px] font-semibold">My Profile</h1>
          <p className="bangla text-[13px] mt-1 text-emerald-50/90">আপনার প্রোফাইল পরিচালনা করুন</p>
        </div>

        <form onSubmit={save} className="mt-6 rounded-2xl border p-6 space-y-5"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>

          {/* Avatar */}
          <div className="flex items-center gap-5">
            <button type="button" onClick={() => fileRef.current?.click()}
              className="relative flex h-24 w-24 items-center justify-center rounded-full overflow-hidden border-4"
              style={{ borderColor: "var(--surface-3)", background: "linear-gradient(135deg,#10b981,#14b8a6)" }}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-white text-[28px] font-bold">{initials}</span>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={onAvatarPick} className="hidden" />
            <div>
              <div className="text-[14px] font-semibold">{form.full_name || "User"}</div>
              <div className="text-[12px]" style={{ color: "var(--text-muted)" }}>{user?.email}</div>
              <button type="button" onClick={() => fileRef.current?.click()}
                className="mt-2 text-[12px] font-medium text-emerald-700">Change photo</button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name *" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} required />
            <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+880 1700-000000" />
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Date of Birth</label>
              <input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Blood Group</label>
              <select value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
                className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <option value="">— Select —</option>
                {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Address</label>
            <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Mirpur, Dhaka"
              className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
          </div>

          <div>
            <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Bio</label>
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={3} placeholder="নিজের সম্পর্কে সংক্ষেপে লিখুন..."
              className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none resize-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
          </div>

          {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-[13px] text-rose-700">{error}</div>}
          {ok && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-[13px] text-emerald-700">{ok}</div>}

          <button type="submit" disabled={saving}
            className="w-full rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 py-3 text-[14px] font-semibold text-white shadow disabled:opacity-50">
            {saving ? "Saving..." : "💾 Save Profile"}
          </button>
        </form>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>{label}</label>
      <input type="text" required={required} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none"
        style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
    </div>
  );
}
