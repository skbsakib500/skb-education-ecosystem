"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Lock, Globe, Users, Building2, ShieldAlert,
  Loader2, Save, RotateCcw, Info,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import type {
  ProfileFieldRegistry, ProfilePrivacySetting, ProfileVisibility,
} from "@/lib/types/profile";

const VISIBILITY_OPTIONS: {
  value: ProfileVisibility;
  label: string;
  desc: string;
  icon: typeof Globe;
}[] = [
  { value: "public",       label: "Public",       desc: "সবাই দেখতে পাবে (Google-এ index)", icon: Globe },
  { value: "members",      label: "Members",      desc: "শুধু logged-in user-রা",         icon: Users },
  { value: "institution",  label: "Institution",  desc: "শুধু same institution-এর সদস্য",   icon: Building2 },
  { value: "restricted",   label: "Private",      desc: "শুধু আমি + প্রতিষ্ঠান admin",     icon: Lock },
];

const SENSITIVITY_COLOR: Record<string, string> = {
  public:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  internal:  "bg-sky-50 text-sky-700 border-sky-200",
  sensitive: "bg-amber-50 text-amber-700 border-amber-200",
  critical:  "bg-red-50 text-red-700 border-red-200",
};

export default function PrivacySettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [masterVisibility, setMasterVisibility] = useState<ProfileVisibility>("restricted");
  const [registry, setRegistry] = useState<ProfileFieldRegistry[]>([]);
  const [overrides, setOverrides] = useState<Record<string, ProfileVisibility>>({});
  const [originalOverrides, setOriginalOverrides] = useState<Record<string, ProfileVisibility>>({});
  const [originalMaster, setOriginalMaster] = useState<ProfileVisibility>("restricted");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      const [profRes, registryRes, overridesRes] = await Promise.all([
        supabase.from("profiles").select("profile_visibility").eq("id", user.id).maybeSingle(),
        supabase.from("profile_field_registry").select("*").order("sensitivity", { ascending: true }),
        supabase.from("profile_privacy_settings").select("*").eq("user_id", user.id),
      ]);

      if (cancelled) return;

      const pv = (profRes.data?.profile_visibility as ProfileVisibility) || "restricted";
      setMasterVisibility(pv);
      setOriginalMaster(pv);

      setRegistry((registryRes.data || []) as ProfileFieldRegistry[]);

      const ov: Record<string, ProfileVisibility> = {};
      (overridesRes.data || []).forEach((row: ProfilePrivacySetting) => {
        ov[row.field_key] = row.visibility;
      });
      setOverrides(ov);
      setOriginalOverrides(ov);

      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [user]);

  const groupedFields = useMemo(() => {
    const groups: Record<string, ProfileFieldRegistry[]> = {
      Basic: [], Contact: [], Personal: [], Professional: [], Social: [],
    };
    const basic = ["full_name", "avatar_url", "headline", "bio", "username", "primary_role", "sub_role", "location"];
    const contact = ["email", "phone", "website"];
    const personal = ["date_of_birth", "blood_group", "address"];
    const professional = ["expertise", "interests", "open_to"];
    const social = ["social_links"];

    registry.forEach((f) => {
      if (basic.includes(f.field_key)) groups.Basic.push(f);
      else if (contact.includes(f.field_key)) groups.Contact.push(f);
      else if (personal.includes(f.field_key)) groups.Personal.push(f);
      else if (professional.includes(f.field_key)) groups.Professional.push(f);
      else if (social.includes(f.field_key)) groups.Social.push(f);
    });
    return groups;
  }, [registry]);

  const effectiveVisibility = (field: ProfileFieldRegistry): ProfileVisibility => {
    return overrides[field.field_key] || field.default_visibility;
  };

  const setFieldVisibility = (field_key: string, vis: ProfileVisibility) => {
    setOverrides((o) => ({ ...o, [field_key]: vis }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // 1. Update master visibility
      if (masterVisibility !== originalMaster) {
        const { error: mErr } = await supabase
          .from("profiles")
          .update({ profile_visibility: masterVisibility })
          .eq("id", user.id);
        if (mErr) throw mErr;
      }

      // 2. Diff overrides
      const toUpsert: { user_id: string; field_key: string; visibility: ProfileVisibility }[] = [];
      const toDelete: string[] = [];

      registry.forEach((f) => {
        const orig = originalOverrides[f.field_key];
        const curr = overrides[f.field_key];

        if (curr && curr !== f.default_visibility) {
          if (curr !== orig) toUpsert.push({ user_id: user.id, field_key: f.field_key, visibility: curr });
        } else if (orig && !curr) {
          toDelete.push(f.field_key);
        }
      });

      if (toDelete.length > 0) {
        const { error: dErr } = await supabase
          .from("profile_privacy_settings")
          .delete()
          .eq("user_id", user.id)
          .in("field_key", toDelete);
        if (dErr) throw dErr;
      }

      if (toUpsert.length > 0) {
        const { error: uErr } = await supabase
          .from("profile_privacy_settings")
          .upsert(toUpsert, { onConflict: "user_id,field_key" });
        if (uErr) throw uErr;
      }

      // Re-sync originals
      setOriginalMaster(masterVisibility);
      setOriginalOverrides(overrides);
      toast.success("Privacy settings saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setMasterVisibility(originalMaster);
    setOverrides(originalOverrides);
    toast.info("Reverted to last saved");
  };

  const hasChanges =
    masterVisibility !== originalMaster ||
    JSON.stringify(overrides) !== JSON.stringify(originalOverrides);

  if (authLoading || loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
        <Loader2 size={18} className="animate-spin" /> Loading privacy settings…
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link href="/profile/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
            <ArrowLeft size={14} /> Back to profile
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Privacy & Visibility</h1>
          <p className="text-sm text-slate-500 mt-1">
            কোন তথ্য কে দেখতে পারবে তা নিয়ন্ত্রণ করুন
          </p>
        </div>
      </div>

      {/* Master toggle */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-start gap-2 mb-3">
          <ShieldAlert size={18} className="text-slate-500 mt-0.5" />
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Profile visibility</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              আপনার পুরো প্রোফাইল কারা দেখতে পারবে
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
          {VISIBILITY_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = masterVisibility === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setMasterVisibility(opt.value)}
                className={
                  "text-left rounded-xl border p-3 transition " +
                  (active
                    ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-100"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50")
                }
              >
                <Icon size={16} className={active ? "text-emerald-600" : "text-slate-500"} />
                <div className="mt-1.5 text-xs font-semibold text-slate-900">{opt.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{opt.desc}</div>
              </button>
            );
          })}
        </div>
        {masterVisibility === "restricted" && (
          <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-800 flex items-start gap-2">
            <Info size={13} className="shrink-0 mt-0.5" />
            <span>Locked profile-এ শুধু আপনি ও আপনার প্রতিষ্ঠান admin দেখতে পাবে। Public link কাজ করবে না।</span>
          </div>
        )}
      </section>

      {/* Per-field groups */}
      {Object.entries(groupedFields).map(([groupName, fields]) => {
        if (fields.length === 0) return null;
        return (
          <section key={groupName} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
              <h2 className="text-sm font-semibold text-slate-900">{groupName}</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {fields.map((field) => {
                const vis = effectiveVisibility(field);
                const isLocked = field.never_public;
                return (
                  <div key={field.field_key} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">{field.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border capitalize ${SENSITIVITY_COLOR[field.sensitivity]}`}>
                          {field.sensitivity}
                        </span>
                        {isLocked && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-red-600 font-semibold">
                            <Lock size={10} /> never public
                          </span>
                        )}
                      </div>
                    </div>
                    <select
                      value={vis}
                      onChange={(e) => setFieldVisibility(field.field_key, e.target.value as ProfileVisibility)}
                      disabled={isLocked && vis !== "restricted" && vis !== "institution" && vis !== "members"}
                      className={
                        "shrink-0 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 " +
                        (isLocked ? "bg-slate-100 cursor-not-allowed" : "")
                      }
                    >
                      <option value="public"      disabled={isLocked}>Public</option>
                      <option value="members">Members</option>
                      <option value="institution">Institution</option>
                      <option value="restricted">Private</option>
                    </select>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Sticky save bar */}
      <div className="sticky bottom-4 z-20">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-lg p-3 flex items-center justify-between gap-2">
          <div className="text-xs text-slate-500">
            {hasChanges ? "Unsaved changes" : "All changes saved"}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              disabled={!hasChanges || saving}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RotateCcw size={13} /> Reset
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
