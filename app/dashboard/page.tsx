"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, type Membership } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import NotificationCenter from "@/components/NotificationCenter";
import { getInstitutionMeta } from "@/lib/institution-types";
import { getBoardMeta } from "@/lib/education-boards";
import { getDivisionMeta } from "@/lib/bangladesh-data";

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [memberships, setMemberships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [mRes, pRes] = await Promise.all([
        supabase.from("memberships")
          .select("id, role, institution_id, institutions:institution_id (*)")
          .eq("user_id", user.id),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      ]);
      setMemberships((mRes.data as any) ?? []);
      setProfile(pRes.data);
      setLoading(false);
    })();
  }, [user]);

  if (authLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <div className="mt-3 text-[13px]" style={{ color: "var(--text-muted)" }}>Loading dashboard...</div>
        </div>
      </main>
    );
  }

  if (!user) return null;

  const firstName = (profile?.full_name || user.email || "").split(/[\s@]/)[0];

  return (
    <main className="min-h-screen pb-16">
      <Header onSignOut={signOut} user={user} profile={profile} />

      <div className="mx-auto max-w-6xl px-4 pt-8 md:px-8">
        {/* Welcome */}
        <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-6 md:p-8 text-white overflow-hidden relative">
          <div className="pointer-events-none absolute -right-20 -top-20 h-[220px] w-[220px] rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-[200px] w-[200px] rounded-full bg-teal-300/20 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[12px] backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-200 animate-pulse" />
              Multi-Tenant Platform • Phase 2
            </div>
            <h1 className="mt-4 text-[26px] md:text-[32px] font-semibold leading-tight">
              Assalamu Alaikum, {firstName || "Admin"}!
              <span className="bangla font-medium opacity-90"> স্বাগতম</span>
            </h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-emerald-50/90">
              আপনার <strong>{memberships.length}</strong> টি প্রতিষ্ঠান আছে।
              {memberships.length === 0 ? " শুরু করুন নতুন প্রতিষ্ঠান যোগ করে।" : " নিজের প্রতিষ্ঠান পরিচালনা করুন।"}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/institutions/new"
                className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-emerald-700 shadow">
                + Create Institution
              </Link>
              <Link href="/" className="rounded-full bg-white/15 px-4 py-2 text-[13px] font-medium backdrop-blur hover:bg-white/20">
                View Public Site
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Institutions" bn="প্রতিষ্ঠান" value={memberships.length} icon="🏛️" />
          <StatCard label="Roles" bn="ভূমিকা" value={new Set(memberships.map(m => m.role)).size} icon="🎭" />
          <StatCard label="Joined" bn="যুক্ত" value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en", { month: "short", year: "numeric" }) : "—"} icon="📅" />
          <StatCard label="Status" bn="অবস্থা" value="Active" icon="✅" />
        </div>

        {/* Institutions */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-semibold">Your Institutions <span className="bangla font-normal text-[14px]" style={{ color: "var(--text-muted)" }}>• প্রতিষ্ঠানসমূহ</span></h2>
            <Link href="/institutions/new" className="text-[13px] font-medium text-emerald-700 dark:text-emerald-300">
              + Add New
            </Link>
          </div>

          {memberships.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {memberships.map((m) => <InstitutionCard key={m.id} membership={m} />)}
            </div>
          )}
        </div>

        <div className="mt-10 text-center text-[11px]" style={{ color: "var(--text-faint)" }}>
          © 2025 SKB Education Ecosystem • Phase 2 (Auth + Multi-Tenant)
        </div>
      </div>
    </main>
  );
}

function Header({ user, profile, onSignOut }: { user: any; profile: any; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const initials = (profile?.full_name || user?.email || "U").slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b"
      style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-[13px] shadow-lg">
            SKB
          </div>
          <div className="leading-tight">
            <div className="text-[14px] font-semibold">SKB Education</div>
            <div className="bangla text-[11px]" style={{ color: "var(--text-muted)" }}>জ্ঞানের ইকোসিস্টেম</div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <NotificationCenter />
          <Link href="/institutions/new"
            className="hidden md:flex items-center gap-1.5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow">
            + New Institution
          </Link>
          <div className="relative">
            <button onClick={() => setOpen(!open)}
              className="flex items-center gap-2 rounded-full border p-1 pr-3"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-[10px] font-bold text-white">
                {initials}
              </div>
              <span className="hidden text-[12px] font-medium md:inline">{profile?.full_name || user?.email?.split("@")[0]}</span>
            </button>
            {open && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                <div className="absolute right-0 mt-2 z-20 w-56 overflow-hidden rounded-2xl border p-2 shadow-xl"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                  <div className="rounded-xl p-3" style={{ background: "var(--bg-soft)" }}>
                    <div className="text-[13px] font-semibold">{profile?.full_name || "User"}</div>
                    <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>{user?.email}</div>
                  </div>
                  <button onClick={onSignOut}
                    className="mt-2 w-full rounded-lg px-3 py-2 text-left text-[13px] hover:bg-[var(--bg-soft)] text-rose-600">
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function StatCard({ label, bn, value, icon }: { label: string; bn: string; value: any; icon: string }) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
      <div className="flex items-center justify-between">
        <span className="text-[16px]">{icon}</span>
      </div>
      <div className="mt-2 text-[20px] font-semibold">{value}</div>
      <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{label}</div>
      <div className="bangla text-[10px]" style={{ color: "var(--text-faint)" }}>{bn}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-4 rounded-2xl border p-8 md:p-12 text-center"
      style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
      <div className="text-[48px]">🏛️</div>
      <div className="mt-3 text-[16px] font-semibold">No institution yet</div>
      <div className="bangla mt-1 text-[13px]" style={{ color: "var(--text-muted)" }}>
        এখনো কোনো প্রতিষ্ঠানে যুক্ত হননি
      </div>
      <div className="mt-4 text-[12px]" style={{ color: "var(--text-muted)" }}>
        শুরু করতে একটি প্রতিষ্ঠান তৈরি করুন বা আমন্ত্রণ গ্রহণ করুন।
      </div>
      <Link href="/institutions/new"
        className="mt-5 inline-block rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-6 py-2.5 text-[13px] font-semibold text-white shadow-lg">
        + Create Institution
      </Link>
    </div>
  );
}

function InstitutionCard({ membership }: { membership: any }) {
  const inst = membership.institutions;
  if (!inst) return null;

  const typeMeta = getInstitutionMeta(inst.type);
  const boardMeta = getBoardMeta(inst.education_board);
  const divisionMeta = getDivisionMeta(inst.division);

  return (
    <Link href={`/institutions/view/?slug=${inst.slug}`}
      className="group relative overflow-hidden rounded-2xl border shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
      style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
      {/* Top gradient with emoji/logo */}
      <div className="h-16 bg-gradient-to-br from-emerald-500 to-teal-600 relative">
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
            membership.role === "admin" ? "bg-white text-emerald-700" : "bg-white/20 text-white backdrop-blur"
          }`}>{membership.role}</span>
        </div>
        <div className="absolute -bottom-6 left-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-4 text-[22px] overflow-hidden"
            style={{ borderColor: "var(--surface-3)", background: "white" }}>
            {inst.logo_url ? (
              <img src={inst.logo_url} alt="" className="h-full w-full object-cover" />
            ) : (inst.emoji || typeMeta.emoji)}
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 pt-10">
        <div className="text-[15px] font-semibold truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition">
          {inst.name}
        </div>
        <div className="text-[11px] capitalize" style={{ color: "var(--text-muted)" }}>
          {typeMeta.emoji} {typeMeta.label}
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          {inst.city || divisionMeta && (
            <span className="rounded-full px-1.5 py-0.5 text-[10px]"
              style={{ background: "var(--bg-soft)", color: "var(--text-muted)" }}>
              📍 {inst.city || divisionMeta?.label}
            </span>
          )}
          {inst.established_year && (
            <span className="rounded-full px-1.5 py-0.5 text-[10px]"
              style={{ background: "var(--bg-soft)", color: "var(--text-muted)" }}>
              Est. {inst.established_year}
            </span>
          )}
        </div>

        <div className="mt-2 truncate text-[10px] font-mono" style={{ color: "var(--text-faint)" }}>
          {boardMeta.emoji} {boardMeta.label}
        </div>
      </div>

      <div className="border-t px-4 py-2.5 flex items-center justify-between text-[10px]"
        style={{ borderColor: "var(--border)", background: "var(--bg-soft)", color: "var(--text-faint)" }}>
        <span className="font-mono truncate">skb.edu.bd/{inst.slug}</span>
        <span className="opacity-0 group-hover:opacity-100 transition">→</span>
      </div>
    </Link>
  );
}
