"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2, Mail, Phone, MapPin, Calendar, Droplet, Globe,
  Facebook, Linkedin, Twitter, Instagram, Youtube,
  Camera, Pencil, X, Save, AlertCircle, Shield, ShieldCheck, Sparkles, Trophy, Users,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Card, Badge, Input } from "@/components/ui";
import { INTERESTS } from "@/lib/onboarding";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const OPEN_TO_OPTIONS = [
  { key: "tutoring",      label: "Tutoring",          emoji: "📖" },
  { key: "jobs",          label: "Job Opportunities", emoji: "💼" },
  { key: "collaboration", label: "Collaboration",     emoji: "🤝" },
  { key: "mentoring",     label: "Mentoring",         emoji: "🧑‍🏫" },
  { key: "freelance",     label: "Freelance",         emoji: "🎨" },
];

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  address: string | null;
  date_of_birth: string | null;
  blood_group: string | null;
  username: string | null;
  headline: string | null;
  expertise: string[] | null;
  open_to: string[] | null;
  location: string | null;
  website: string | null;
  social_links: Record<string, string> | null;
  followers_count: number | null;
  following_count: number | null;
  primary_role: string | null;
  sub_role: string | null;
  interests: string[] | null;
};

type FormState = {
  full_name: string;
  username: string;
  headline: string;
  bio: string;
  phone: string;
  address: string;
  date_of_birth: string;
  blood_group: string;
  location: string;
  website: string;
  expertise: string[];
  interests: string[];
  open_to: string[];
  social_links: {
    facebook: string;
    linkedin: string;
    twitter: string;
    instagram: string;
    youtube: string;
  };
};

const emptyForm: FormState = {
  full_name: "", username: "", headline: "", bio: "",
  phone: "", address: "", date_of_birth: "", blood_group: "",
  location: "", website: "",
  expertise: [], interests: [], open_to: [],
  social_links: { facebook: "", linkedin: "", twitter: "", instagram: "", youtube: "" },
};

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [points, setPoints] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);
  const [verificationBadges, setVerificationBadges] = useState<{ id: string; type: string; verified_at: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [profRes, gamRes, badgesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.rpc("my_gamification"),
        supabase.rpc("get_verification_badges", { p_user_id: user.id }),
      ]);

      const p = profRes.data as ProfileRow | null;
      if (p) {
        setProfile(p);
        setAvatarPreview(p.avatar_url || "");
        setForm({
          full_name: p.full_name || "",
          username: p.username || "",
          headline: p.headline || "",
          bio: p.bio || "",
          phone: p.phone || "",
          address: p.address || "",
          date_of_birth: p.date_of_birth || "",
          blood_group: p.blood_group || "",
          location: p.location || "",
          website: p.website || "",
          expertise: (p.expertise as string[]) || [],
          interests: (p.interests as string[]) || [],
          open_to: (p.open_to as string[]) || [],
          social_links: {
            facebook: p.social_links?.facebook || "",
            linkedin: p.social_links?.linkedin || "",
            twitter: p.social_links?.twitter || "",
            instagram: p.social_links?.instagram || "",
            youtube: p.social_links?.youtube || "",
          },
        });
      }

      const g = gamRes.data as any;
      if (g) {
        setPoints(g.points || g.total_points || 0);
        setBadgeCount((g.badges || []).length);
      }
      if (Array.isArray(badgesRes.data)) {
        setVerificationBadges(badgesRes.data);
      }
      setLoading(false);
    })();
  }, [user]);

  const onAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { toast.error("Avatar max 2 MB"); return; }
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  };

  const toggleChip = (field: "expertise" | "interests" | "open_to", v: string) => {
    setForm((f) => {
      const cur = f[field];
      return { ...f, [field]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] };
    });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let avatarUrl = profile?.avatar_url || "";

      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop() || "jpg";
        const path = `${user.id}/avatar-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { upsert: true, cacheControl: "3600" });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = pub.publicUrl;
      }

      const payload = {
        full_name: form.full_name.trim(),
        username: form.username.trim() || null,
        headline: form.headline.trim() || null,
        bio: form.bio.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        date_of_birth: form.date_of_birth || null,
        blood_group: form.blood_group || null,
        location: form.location.trim() || null,
        website: form.website.trim() || null,
        expertise: form.expertise,
        interests: form.interests,
        open_to: form.open_to,
        social_links: form.social_links,
        avatar_url: avatarUrl,
      };

      const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
      if (error) throw error;

      toast.success("Profile updated");
      setProfile((p) => (p ? { ...p, ...payload } : p));
      setAvatarFile(null);
      setEditing(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setAvatarFile(null);
    setAvatarPreview(profile?.avatar_url || "");
    if (profile) {
      setForm({
        full_name: profile.full_name || "",
        username: profile.username || "",
        headline: profile.headline || "",
        bio: profile.bio || "",
        phone: profile.phone || "",
        address: profile.address || "",
        date_of_birth: profile.date_of_birth || "",
        blood_group: profile.blood_group || "",
        location: profile.location || "",
        website: profile.website || "",
        expertise: (profile.expertise as string[]) || [],
        interests: (profile.interests as string[]) || [],
        open_to: (profile.open_to as string[]) || [],
        social_links: {
          facebook: profile.social_links?.facebook || "",
          linkedin: profile.social_links?.linkedin || "",
          twitter: profile.social_links?.twitter || "",
          instagram: profile.social_links?.instagram || "",
          youtube: profile.social_links?.youtube || "",
        },
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500 text-sm gap-2">
        <Loader2 size={18} className="animate-spin" /> Loading profile…
      </div>
    );
  }

  if (!profile) {
    return <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-600">Profile not found.</div>;
  }

  const initials = (profile.full_name || "U").charAt(0).toUpperCase();
  const socialEntries = Object.entries(profile.social_links || {}).filter(([, v]) => v);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header card */}
      <div className="rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        <div className="h-32 md:h-40 bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 relative">
          {editing && (
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-white shadow"
            >
              <Camera size={14} /> Change photo
            </button>
          )}
        </div>

        <div className="px-6 pb-6 -mt-12">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div className="flex items-end gap-4">
              <div className="relative">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarPreview} alt="" className="w-24 h-24 md:w-28 md:h-28 rounded-3xl border-4 border-white object-cover bg-slate-100 shadow-lg" />
                ) : (
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl border-4 border-white bg-slate-200 shadow-lg flex items-center justify-center text-slate-600 text-3xl font-bold">
                    {initials}
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={onAvatarPick} className="hidden" />
              </div>
              <div className="pb-1">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900">{profile.full_name || "Unnamed"}</h1>
                {profile.username && <p className="text-sm text-slate-500">@{profile.username}</p>}
                {profile.headline && <p className="text-sm text-slate-600 mt-1">{profile.headline}</p>}
              </div>
            </div>

            {!editing ? (
              <div className="flex gap-2">
                <Link href="/settings/privacy/" className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <Shield size={14} /> Privacy
                </Link>
                <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <Pencil size={14} /> Edit
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={cancelEdit} className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <X size={14} /> Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            {profile.primary_role && (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700 capitalize">
                {profile.sub_role || profile.primary_role}
              </span>
            )}
            {profile.location && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                <MapPin size={12} /> {profile.location}
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
              <Sparkles size={12} /> {points} pts
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-violet-700">
              <Trophy size={12} /> {badgeCount} badges
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
              <Users size={12} /> {profile.followers_count || 0} followers · {profile.following_count || 0} following
            </span>
            {verificationBadges.map((b) => (
              <span key={b.id} className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-800 font-semibold capitalize" title={`Verified ${new Date(b.verified_at).toLocaleDateString()}`}>
                <ShieldCheck size={12} /> {b.type} verified
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      {!editing ? (
        <div className="space-y-4">
          <Section title="About">
            {profile.bio ? (
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
            ) : (
              <p className="text-sm text-slate-500 italic">Add a short bio to introduce yourself</p>
            )}
          </Section>

          {(profile.email || profile.phone || profile.website) && (
            <Section title="Contact">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {profile.email && <Info icon={<Mail size={14} />} label="Email" value={profile.email} />}
                {profile.phone && <Info icon={<Phone size={14} />} label="Phone" value={profile.phone} />}
                {profile.website && (
                  <Info
                    icon={<Globe size={14} />}
                    label="Website"
                    value={<a href={profile.website} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline break-all">{profile.website}</a>}
                  />
                )}
              </div>
            </Section>
          )}

          {(profile.date_of_birth || profile.blood_group || profile.address) && (
            <Section title="Personal">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {profile.date_of_birth && <Info icon={<Calendar size={14} />} label="Date of birth" value={profile.date_of_birth} />}
                {profile.blood_group && <Info icon={<Droplet size={14} />} label="Blood group" value={profile.blood_group} />}
                {profile.address && <Info icon={<MapPin size={14} />} label="Address" value={profile.address} />}
              </div>
            </Section>
          )}

          {((profile.expertise?.length ?? 0) > 0 || (profile.interests?.length ?? 0) > 0 || (profile.open_to?.length ?? 0) > 0) && (
            <Section title="Professional">
              {(profile.expertise?.length ?? 0) > 0 && <ChipList label="Expertise" chips={profile.expertise!} color="emerald" />}
              {(profile.interests?.length ?? 0) > 0 && <ChipList label="Interests" chips={profile.interests!} color="cyan" />}
              {(profile.open_to?.length ?? 0) > 0 && <ChipList label="Open to" chips={profile.open_to!} color="violet" />}
            </Section>
          )}

          {socialEntries.length > 0 && (
            <Section title="Social links">
              <div className="flex flex-wrap gap-2">
                {profile.social_links?.facebook && <SocialBtn href={profile.social_links.facebook} icon={<Facebook size={15} />} label="Facebook" />}
                {profile.social_links?.linkedin && <SocialBtn href={profile.social_links.linkedin} icon={<Linkedin size={15} />} label="LinkedIn" />}
                {profile.social_links?.twitter && <SocialBtn href={profile.social_links.twitter} icon={<Twitter size={15} />} label="Twitter" />}
                {profile.social_links?.instagram && <SocialBtn href={profile.social_links.instagram} icon={<Instagram size={15} />} label="Instagram" />}
                {profile.social_links?.youtube && <SocialBtn href={profile.social_links.youtube} icon={<Youtube size={15} />} label="YouTube" />}
              </div>
            </Section>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <Section title="Basic">
            <Field label="Full name">
              <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={inp} />
            </Field>
            <Field label="Username" hint="Unique handle, lowercase + numbers + _">
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="sakib_hasan" className={inp} />
            </Field>
            <Field label="Headline" hint="Short one-liner">
              <input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} placeholder="Class 10 Student · Science" className={inp} />
            </Field>
            <Field label="Bio">
              <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} className={inp + " resize-none"} />
            </Field>
            <Field label="Location">
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Dhaka, Bangladesh" className={inp} />
            </Field>
          </Section>

          <Section title="Contact">
            <Field label="Phone">
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+880 1700-000000" className={inp} />
            </Field>
            <Field label="Website">
              <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://yoursite.com" className={inp} />
            </Field>
          </Section>

          <Section title="Personal">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Date of birth">
                <input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} className={inp} />
              </Field>
              <Field label="Blood group">
                <select value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })} className={inp}>
                  <option value="">— Select —</option>
                  {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Address">
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="House, Road, Area" className={inp} />
            </Field>
          </Section>

          <Section title="Expertise" hint="Subjects you teach or know well">
            <ChipPicker options={INTERESTS} selected={form.expertise} onToggle={(v) => toggleChip("expertise", v)} color="emerald" />
          </Section>

          <Section title="Interests">
            <ChipPicker options={INTERESTS} selected={form.interests} onToggle={(v) => toggleChip("interests", v)} color="cyan" />
          </Section>

          <Section title="Open to">
            <div className="flex flex-wrap gap-2">
              {OPEN_TO_OPTIONS.map((o) => {
                const active = form.open_to.includes(o.key);
                return (
                  <button key={o.key} type="button" onClick={() => toggleChip("open_to", o.key)}
                    className={"inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition " + (active ? "bg-violet-50 border-violet-300 text-violet-700" : "border-slate-300 text-slate-600 hover:bg-slate-50")}>
                    <span>{o.emoji}</span> {o.label}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="Social links">
            <div className="space-y-2">
              <SocialInput icon={<Facebook size={14} />} value={form.social_links.facebook} onChange={(v) => setForm({ ...form, social_links: { ...form.social_links, facebook: v } })} placeholder="https://facebook.com/yourname" />
              <SocialInput icon={<Linkedin size={14} />} value={form.social_links.linkedin} onChange={(v) => setForm({ ...form, social_links: { ...form.social_links, linkedin: v } })} placeholder="https://linkedin.com/in/yourname" />
              <SocialInput icon={<Twitter size={14} />} value={form.social_links.twitter} onChange={(v) => setForm({ ...form, social_links: { ...form.social_links, twitter: v } })} placeholder="https://twitter.com/yourname" />
              <SocialInput icon={<Instagram size={14} />} value={form.social_links.instagram} onChange={(v) => setForm({ ...form, social_links: { ...form.social_links, instagram: v } })} placeholder="https://instagram.com/yourname" />
              <SocialInput icon={<Youtube size={14} />} value={form.social_links.youtube} onChange={(v) => setForm({ ...form, social_links: { ...form.social_links, youtube: v } })} placeholder="https://youtube.com/@yourname" />
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}

/* ---- small components ---- */

const inp = "w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";


/* ═══════════════════════════════════════════════════════════
   Sub-components — Phase 6c.1 design system upgrade
   ═══════════════════════════════════════════════════════════ */

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <Card variant="surface" padding="lg">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-fluid-caption font-semibold text-fg uppercase tracking-wider">
          {title}
        </h2>
        {hint && (
          <span className="text-fluid-micro text-fg-muted">{hint}</span>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </Card>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-fluid-body-sm font-medium text-fg mb-1.5">
        {label}
      </label>
      {children}
      {hint && (
        <p className="mt-1 text-fluid-caption text-fg-muted">{hint}</p>
      )}
    </div>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 text-fg">
      <span className="text-fg-muted mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="text-fluid-micro text-fg-muted uppercase tracking-wider">
          {label}
        </div>
        <div className="text-fluid-body-sm break-words">{value}</div>
      </div>
    </div>
  );
}

function ChipList({
  label,
  chips,
  color,
}: {
  label: string;
  chips: string[];
  color: "emerald" | "cyan" | "violet";
}) {
  const variantMap: Record<typeof color, "success" | "default" | "accent"> = {
    emerald: "success",
    cyan: "default",
    violet: "accent",
  };
  return (
    <div>
      <div className="text-fluid-micro text-fg-muted uppercase tracking-wider mb-2">
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {chips.map((s) => (
          <Badge key={s} variant={variantMap[color]} size="md">
            {s}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function ChipPicker({
  options,
  selected,
  onToggle,
  color,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (v: string) => void;
  color: "emerald" | "cyan";
}) {
  const activeClass =
    color === "emerald"
      ? "bg-emerald-100 border-emerald-500 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700"
      : "bg-cyan-100 border-cyan-500 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-700";

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((s) => {
        const active = selected.includes(s);
        return (
          <button
            key={s}
            type="button"
            onClick={() => onToggle(s)}
            className={`rounded-full border px-3 py-1 text-fluid-caption font-medium transition-colors duration-fast ${
              active
                ? activeClass
                : "border-border text-fg-muted hover:bg-surface-hover"
            }`}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}

function SocialInput({
  icon,
  value,
  onChange,
  placeholder,
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      iconLeft={icon}
    />
  );
}

function SocialBtn({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-solid px-3 py-1.5 text-fluid-caption font-medium text-fg hover:bg-surface-hover transition-colors duration-fast"
    >
      {icon} {label}
    </a>
  );
}
