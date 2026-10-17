"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ShieldCheck, ShieldOff, Loader2, Search, Building2, User,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

type Member = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  username: string | null;
  primary_role: string | null;
  institution_id: string;
  institution_name: string;
  institution_slug: string;
  is_verified: boolean;
  verification_id: string | null;
};

export default function VerificationPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.rpc("my_verifiable_members");
      setMembers((data as Member[]) || []);
      setLoading(false);
    })();
  }, [user]);

  const grant = async (member: Member) => {
    setWorking(member.user_id);
    const { error } = await supabase.rpc("grant_verification", {
      p_target_id: member.user_id,
      p_verification_type: "institution",
    });
    setWorking(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${member.full_name || "Member"} verified`);
    setMembers((prev) =>
      prev.map((m) =>
        m.user_id === member.user_id
          ? { ...m, is_verified: true, verification_id: "granted" }
          : m
      )
    );
  };

  const revoke = async (member: Member) => {
    if (!member.verification_id) return;
    setWorking(member.user_id);
    const { error } = await supabase.rpc("revoke_verification", {
      p_record_id: member.verification_id,
      p_reason: "Revoked by institution admin",
    });
    setWorking(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Verification revoked`);
    setMembers((prev) =>
      prev.map((m) =>
        m.user_id === member.user_id
          ? { ...m, is_verified: false, verification_id: null }
          : m
      )
    );
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center text-fg-muted text-fluid-body-sm flex items-center justify-center gap-2">
        <Loader2 size={18} className="animate-spin" /> Loading…
      </div>
    );
  }

  const filtered = members.filter((m) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      (m.full_name || "").toLowerCase().includes(q) ||
      (m.username || "").toLowerCase().includes(q) ||
      (m.institution_name || "").toLowerCase().includes(q)
    );
  });

  const grouped: Record<string, Member[]> = {};
  filtered.forEach((m) => {
    const k = `${m.institution_name}||${m.institution_slug}`;
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(m);
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div>
        <Link href="/hub/" className="inline-flex items-center gap-1 text-fluid-body-sm text-fg-muted hover:text-fg">
          <ArrowLeft size={14} /> Back to Hub
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-fg">Verify Members</h1>
        <p className="text-fluid-body-sm text-fg-muted mt-1">
          Verify teachers & staff in your institutions — adds a trusted badge to their profile.
        </p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, username or institution…"
          className="w-full rounded-xl border border-border-strong pl-10 pr-3 py-2.5 text-fluid-body-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-strong bg-white p-10 text-center">
          <ShieldCheck size={32} className="mx-auto text-fg-subtle mb-2" />
          <h2 className="text-base font-semibold text-fg">No members to verify</h2>
          <p className="mt-1 text-fluid-body-sm text-fg-muted max-w-sm mx-auto">
            আপনি কোনো প্রতিষ্ঠানের admin না হলে, অথবা সেই প্রতিষ্ঠানে কোনো teacher/staff না থাকলে এখানে কিছু দেখাবে না।
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([key, group]) => {
            const [name, slug] = key.split("||");
            return (
              <section key={key} className="rounded-2xl border border-border bg-white overflow-hidden">
                <div className="px-5 py-3 bg-canvas-soft border-b border-border flex items-center gap-2">
                  <Building2 size={15} className="text-fg-muted" />
                  <Link href={`/institutions/view/?slug=${slug}`} className="text-fluid-body-sm font-semibold text-fg hover:text-emerald-600">
                    {name}
                  </Link>
                  <span className="ml-auto text-fluid-caption text-fg-muted">{group.length} member{group.length > 1 ? "s" : ""}</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {group.map((m) => {
                    const initials = (m.full_name || "U").charAt(0).toUpperCase();
                    return (
                      <div key={m.user_id} className="px-5 py-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-surface-hover flex items-center justify-center overflow-hidden shrink-0">
                          {m.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-fluid-caption font-semibold text-fg-muted">{initials}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-fluid-body-sm font-medium text-fg truncate">{m.full_name || "Unnamed"}</span>
                            {m.is_verified && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-fluid-micro font-semibold text-emerald-700">
                                <ShieldCheck size={10} /> Verified
                              </span>
                            )}
                          </div>
                          <div className="text-fluid-caption text-fg-muted capitalize">
                            {m.primary_role || "member"}
                            {m.username && <> · @{m.username}</>}
                          </div>
                        </div>
                        {m.is_verified ? (
                          <button
                            onClick={() => revoke(m)}
                            disabled={working === m.user_id}
                            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-fluid-caption font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            {working === m.user_id ? <Loader2 size={12} className="animate-spin" /> : <ShieldOff size={12} />}
                            Revoke
                          </button>
                        ) : (
                          <button
                            onClick={() => grant(m)}
                            disabled={working === m.user_id}
                            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-fluid-caption font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {working === m.user_id ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
                            Verify
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
