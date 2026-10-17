"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { ROLES } from "@/lib/onboarding";
import { isValidRole } from "@/lib/roles";

export default function Page() {
  return (
    <Suspense fallback={<FullSpinner />}>
      <OnboardingInner />
    </Suspense>
  );
}

function FullSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
    </div>
  );
}

function OnboardingInner() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const picking = sp.get("pick") === "1";

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_complete, primary_role")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (data?.onboarding_complete) {
        router.push("/hub/");
        return;
      }

      const intended = (user.user_metadata as Record<string, unknown> | null)?.intended_role;
      if (!picking && isValidRole(typeof intended === "string" ? intended : null)) {
        router.replace(`/onboarding/${intended}/`);
        return;
      }

      setChecking(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, router, picking]);

  const pick = async (role: string) => {
    setLoading(true);
    try {
      await supabase.rpc("record_user_intent", {
        p_intended_role: role,
        p_step: 1,
        p_extra: {},
      });
    } catch {
      /* non-blocking */
    }
    router.push(`/onboarding/${role}/`);
  };

  if (authLoading || checking) return <FullSpinner />;

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <Link href="/hub/" className="inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold shadow-lg">
              S
            </div>
          </Link>
          <div
            className="mt-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-fluid-caption font-medium"
            style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Step 1 of 3
          </div>
          <h1 className="mt-5 text-[28px] md:text-[36px] font-semibold tracking-tight">
            আপনি কে? <span className="bangla font-normal">আপনার ভূমিকা</span>
          </h1>
          <p className="mt-2 text-[14px]" style={{ color: "var(--text-muted)" }}>
            আপনার প্রয়োজন অনুযায়ী experience সাজাবো
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ROLES.map((r) => (
            <button
              key={r.key}
              onClick={() => pick(r.key)}
              disabled={loading}
              className="group relative overflow-hidden rounded-2xl border p-5 text-left transition hover:-translate-y-1 hover:shadow-xl disabled:opacity-50"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}
            >
              <div
                className="absolute top-0 inset-x-0 h-1 opacity-0 group-hover:opacity-100 transition"
                style={{ background: r.color }}
              />
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-[28px]"
                style={{ background: r.color + "20" }}
              >
                {r.emoji}
              </div>
              <div className="mt-4">
                <div className="text-[16px] font-semibold">{r.label}</div>
                <div className="bangla text-[13px]" style={{ color: "var(--text-muted)" }}>
                  {r.bn}
                </div>
                <div className="mt-2 text-fluid-caption leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {r.desc}
                </div>
              </div>
              <div
                className="mt-4 text-fluid-caption font-medium opacity-0 group-hover:opacity-100 transition"
                style={{ color: r.color }}
              >
                Continue →
              </div>
            </button>
          ))}
        </div>

        <div className="mt-10 text-center text-fluid-micro" style={{ color: "var(--text-faint)" }}>
          আপনার ভূমিকা পরে পরিবর্তন করা যাবে
        </div>
      </div>
    </main>
  );
}
