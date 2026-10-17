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
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save";
      toast.error(msg);
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
      <div className="flex items-center justify-center py-24 text-fg-muted text-fluid-body-sm gap-2">
        <Loader2 size={18} className="animate-spin" /> Loading profile…
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-5 py-16 text-center text-fg-muted text-fluid-body">
        Profile not found.
      </div>
    );
  }

  const initials = (profile.full_name || "U").charAt(0).toUpperCase();
  const socialEntries = Object.entries(profile.social_links || {}).filter(([, v]) => v);

  return (
    <div className="max-w-4xl mx-auto px-5 py-6 space-y-6">
      {/* ═══════ Header Card ═══════ */}
      <Card variant="elevated" padding="none" className="overflow-hidden">
        {/* Cover */}
        <div className="h-32 md:h-40 bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 relative">
          {editing && (
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-fluid-caption font-medium text-slate-800 hover:bg-white shadow-elevation-1 transition-colors duration-fast"
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
                  <img
                    src={avatarPreview}
                    alt=""
                    className="w-24 h-24 md:w-28 md:h-28 rounded-3xl border-4 border-white object-cover bg-canvas-soft shadow-elevation-2"
                  />
                ) : (
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl border-4 border-white bg-accent text-accent-fg shadow-elevation-2 flex items-center justify-center text-fluid-h1 font-bold">
                    {initials}
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={onAvatarPick}
                  className="hidden"
                />
              </div>
              <div className="pb-1">
                <h1 className="text-fluid-h2 text-fg">
                  {profile.full_name || "Unnamed"}
                </h1>
                {profile.username && (
                  <p className="text-fluid-body-sm text-fg-muted">
                    @{profile.username}
                  </p>
                )}
                {profile.headline && (
                  <p className="text-fluid-body-sm text-fg-muted mt-1">
                    {profile.headline}
                  </p>
                )}
              </div>
            </div>

            {!editing ? (
              <div className="flex gap-2">
                <Link href="/settings/privacy/">
                  <Button variant="outline" iconLeft={<Shield size={14} />}>
                    Privacy
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => setEditing(true)}
                  iconLeft={<Pencil size={14} />}
                >
                  Edit
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={cancelEdit}
                  iconLeft={<X size={14} />}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  loading={saving}
                  iconLeft={!saving ? <Save size={14} /> : undefined}
                >
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            )}
          </div>

          {/* Chips row */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {profile.primary_role && (
              <Badge variant="success" size="md" className="capitalize">
                {profile.sub_role || profile.primary_role}
              </Badge>
            )}
            {profile.location && (
              <Badge variant="muted" size="md">
                <MapPin size={12} /> {profile.location}
              </Badge>
            )}
            <Badge variant="warning" size="md">
              <Sparkles size={12} /> {points} pts
            </Badge>
            <Badge variant="accent" size="md">
              <Trophy size={12} /> {badgeCount} badges
            </Badge>
            <Badge variant="muted" size="md">
              <Users size={12} /> {profile.followers_count || 0} followers ·{" "}
              {profile.following_count || 0} following
            </Badge>
            {verificationBadges.map((b) => (
              <Badge
                key={b.id}
                variant="success"
                size="md"
                className="capitalize"
                title={`Verified ${new Date(b.verified_at).toLocaleDateString()}`}
              >
                <ShieldCheck size={12} /> {b.type} verified
              </Badge>
            ))}
          </div>
        </div>
      </Card>

      {/* ═══════ Body ═══════ */}
      {!editing ? (
        <div className="space-y-4">
          <Section title="About">
            {profile.bio ? (
              <p className="text-fluid-body text-fg leading-relaxed whitespace-pre-wrap">
                {profile.bio}
              </p>
            ) : (
              <p className="text-fluid-body text-fg-muted italic">
                Add a short bio to introduce yourself
              </p>
            )}
          </Section>

          {(profile.email || profile.phone || profile.website) && (
            <Section title="Contact">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {profile.email && (
                  <Info icon={<Mail size={14} />} label="Email" value={profile.email} />
                )}
                {profile.phone && (
                  <Info icon={<Phone size={14} />} label="Phone" value={profile.phone} />
                )}
                {profile.website && (
                  <Info
                    icon={<Globe size={14} />}
                    label="Website"
                    value={
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent hover:underline break-all"
                      >
                        {profile.website}
                      </a>
                    }
                  />
                )}
              </div>
            </Section>
          )}

          {(profile.date_of_birth || profile.blood_group || profile.address) && (
            <Section title="Personal">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {profile.date_of_birth && (
                  <Info icon={<Calendar size={14} />} label="Date of birth" value={profile.date_of_birth} />
                )}
                {profile.blood_group && (
                  <Info icon={<Droplet size={14} />} label="Blood group" value={profile.blood_group} />
                )}
                {profile.address && (
                  <Info icon={<MapPin size={14} />} label="Address" value={profile.address} />
                )}
              </div>
            </Section>
          )}

          {((profile.expertise?.length ?? 0) > 0 ||
            (profile.interests?.length ?? 0) > 0 ||
            (profile.open_to?.length ?? 0) > 0) && (
            <Section title="Professional">
              {(profile.expertise?.length ?? 0) > 0 && (
                <ChipList label="Expertise" chips={profile.expertise!} color="emerald" />
              )}
              {(profile.interests?.length ?? 0) > 0 && (
                <ChipList label="Interests" chips={profile.interests!} color="cyan" />
              )}
              {(profile.open_to?.length ?? 0) > 0 && (
                <ChipList label="Open to" chips={profile.open_to!} color="violet" />
              )}
            </Section>
          )}

          {socialEntries.length > 0 && (
            <Section title="Social links">
              <div className="flex flex-wrap gap-2">
                {profile.social_links?.facebook && (
                  <SocialBtn href={profile.social_links.facebook} icon={<Facebook size={15} />} label="Facebook" />
                )}
                {profile.social_links?.linkedin && (
                  <SocialBtn href={profile.social_links.linkedin} icon={<Linkedin size={15} />} label="LinkedIn" />
                )}
                {profile.social_links?.twitter && (
                  <SocialBtn href={profile.social_links.twitter} icon={<Twitter size={15} />} label="Twitter" />
                )}
                {profile.social_links?.instagram && (
                  <SocialBtn href={profile.social_links.instagram} icon={<Instagram size={15} />} label="Instagram" />
                )}
                {profile.social_links?.youtube && (
                  <SocialBtn href={profile.social_links.youtube} icon={<Youtube size={15} />} label="YouTube" />
                )}
              </div>
            </Section>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <Section title="Basic">
            <Field label="Full name">
              <Input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </Field>
            <Field label="Username" hint="Unique handle, lowercase + numbers + _">
              <Input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="sakib_hasan"
              />
            </Field>
            <Field label="Headline" hint="Short one-liner">
              <Input
                value={form.headline}
                onChange={(e) => setForm({ ...form, headline: e.target.value })}
                placeholder="Class 10 Student · Science"
              />
            </Field>
            <Field label="Bio">
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={3}
                className="w-full rounded-lg bg-surface-solid border border-border text-fg placeholder:text-fg-subtle px-3.5 py-2.5 text-fluid-body transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent resize-none"
              />
            </Field>
            <Field label="Location">
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Dhaka, Bangladesh"
              />
            </Field>
          </Section>

          <Section title="Contact">
            <Field label="Phone">
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+880 1700-000000"
              />
            </Field>
            <Field label="Website">
              <Input
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://yoursite.com"
              />
            </Field>
          </Section>

          <Section title="Personal">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Date of birth">
                <Input
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                />
              </Field>
              <Field label="Blood group">
                <select
                  value={form.blood_group}
                  onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
                  className="w-full h-11 rounded-lg bg-surface-solid border border-border text-fg px-3.5 text-fluid-body transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent"
                >
                  <option value="">— Select —</option>
                  {BLOOD_GROUPS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Address">
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="House, Road, Area"
              />
            </Field>
          </Section>

          <Section title="Expertise" hint="Subjects you teach or know well">
            <ChipPicker
              options={INTERESTS}
              selected={form.expertise}
              onToggle={(v) => toggleChip("expertise", v)}
              color="emerald"
            />
          </Section>

          <Section title="Interests">
            <ChipPicker
              options={INTERESTS}
              selected={form.interests}
              onToggle={(v) => toggleChip("interests", v)}
              color="cyan"
            />
          </Section>

          <Section title="Open to">
            <div className="flex flex-wrap gap-2">
              {OPEN_TO_OPTIONS.map((o) => {
                const active = form.open_to.includes(o.key);
                return (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => toggleChip("open_to", o.key)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-fluid-caption font-medium transition-colors duration-fast ${
                      active
                        ? "bg-violet-100 border-violet-500 text-violet-700 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-700"
                        : "border-border text-fg-muted hover:bg-surface-hover"
                    }`}
                  >
                    <span>{o.emoji}</span> {o.label}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="Social links">
            <div className="space-y-2">
              <SocialInput
                icon={<Facebook size={14} />}
                value={form.social_links.facebook}
                onChange={(v) =>
                  setForm({ ...form, social_links: { ...form.social_links, facebook: v } })
                }
                placeholder="https://facebook.com/yourname"
              />
              <SocialInput
                icon={<Linkedin size={14} />}
                value={form.social_links.linkedin}
                onChange={(v) =>
                  setForm({ ...form, social_links: { ...form.social_links, linkedin: v } })
                }
                placeholder="https://linkedin.com/in/yourname"
              />
              <SocialInput
                icon={<Twitter size={14} />}
                value={form.social_links.twitter}
                onChange={(v) =>
                  setForm({ ...form, social_links: { ...form.social_links, twitter: v } })
                }
                placeholder="https://twitter.com/yourname"
              />
              <SocialInput
                icon={<Instagram size={14} />}
                value={form.social_links.instagram}
                onChange={(v) =>
                  setForm({ ...form, social_links: { ...form.social_links, instagram: v } })
                }
                placeholder="https://instagram.com/yourname"
              />
              <SocialInput
                icon={<Youtube size={14} />}
                value={form.social_links.youtube}
                onChange={(v) =>
                  setForm({ ...form, social_links: { ...form.social_links, youtube: v } })
                }
                placeholder="https://youtube.com/@yourname"
              />
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}

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
