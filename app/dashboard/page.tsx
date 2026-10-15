"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, type Membership } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("memberships")
        .select("id, institution_id, role, institutions:institution_id (id, name, slug, type, status)")
        .eq("user_id", user.id);

      setMemberships((data as any) ?? []);
      setLoading(false);
    })();
  }, [user]);

  if (authLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <div className="mt-3 text-[13px]" style={{ color: "var(--text-muted)" }}>Loading...</div>
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen px-4 py-10 md:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold">
              SKB
            </div>
            <div>
              <div className="text-[15px] font-semibold">My Workspaces</div>
              <div className="bangla text-[11px]" style={{ color: "var(--text-muted)" }}>
                আমার প্রতিষ্ঠানসমূহ
              </div>
            </div>
          </Link>
          <button onClick={signOut}
            className="rounded-full border px-4 py-1.5 text-[13px]"
            style={{ borderColor: "var(--border)" }}>
            Sign out
          </button>
        </div>

        <div className="mt-8 rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <div className="text-[12px]" style={{ color: "var(--text-muted)" }}>Signed in as</div>
          <div className="text-[15px] font-medium">{user.email}</div>
        </div>

        <div className="mt-6">
          <h2 className="text-[18px] font-semibold">Your Institutions</h2>

          {memberships.length === 0 ? (
            <div className="mt-4 rounded-2xl border p-8 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <div className="text-[15px] font-medium">No institution yet</div>
              <div className="bangla mt-1 text-[13px]" style={{ color: "var(--text-muted)" }}>
                এখনো কোনো প্রতিষ্ঠানে যুক্ত হননি
              </div>
              <Link href="/institutions/new"
                className="mt-4 inline-block rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-2 text-[13px] font-semibold text-white shadow-lg">
                Create Institution →
              </Link>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {memberships.map((m) => (
                <div key={m.id} className="rounded-2xl border p-5 shadow-sm"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold">
                      {(m.institution?.name ?? "?")[0]}
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 capitalize">
                      {m.role}
                    </span>
                  </div>
                  <div className="mt-3 text-[15px] font-semibold">{m.institution?.name}</div>
                  <div className="text-[12px] capitalize" style={{ color: "var(--text-muted)" }}>
                    {m.institution?.type} • /{m.institution?.slug}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-[11px]" style={{ color: "var(--text-faint)" }}>
          © 2025 SKB Education Ecosystem • Phase 2 (Auth)
        </div>
      </div>
    </main>
  );
}
