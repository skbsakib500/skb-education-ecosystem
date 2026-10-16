"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { ROLES } from "@/lib/onboarding";

export default function Onboarding() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("onboarding_complete, primary_role").eq("id", user.id).maybeSingle();
      if (data?.onboarding_complete) {
        router.push("/hub/");
        return;
      }
      setChecking(false);
    })();
  }, [user, router]);

  const pick = async (role: string) => {
    setLoading(true);
    await supabase.rpc("record_user_intent", {
      p_intended_role: role, p_step: 1, p_extra: {},
    });
    router.push("/onboarding/" + role + "/");
  };

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <Link href="/hub" className="inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold shadow-lg">SKB</div>
          </Link>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[12px] font-medium"
            style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Step 1 of 3
          </div>
          <h1 className="mt-5 text-[28px] md:text-[36px] font-semibold tracking-tight">
            আপনি কে? · <span className="bangla font-normal">আপনার ভূমিকা</span>
          </h1>
          <p className="mt-2 text-[14px]" style={{ color: "var(--text-muted)" }}>
            আপনার প্রয়োজন অনুযায়ী experience সাজাবো
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ROLES.map((r) => (
            <button key={r.key} onClick={() => pick(r.key)} disabled={loading}
              className="group relative overflow-hidden rounded-2xl border p-5 text-left transition hover:-translate-y-1 hover:shadow-xl disabled:opacity-50"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <div className="absolute top-0 inset-x-0 h-1 opacity-0 group-hover:opacity-100 transition"
                style={{ background: r.color }} />
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-[28px]"
                style={{ background: r.color + "20" }}>
                {r.emoji}
              </div>
              <div className="mt-4">
                <div className="text-[16px] font-semibold">{r.label}</div>
                <div className="bangla text-[13px]" style={{ color: "var(--text-muted)" }}>{r.bn}</div>
                <div className="mt-2 text-[12px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{r.desc}</div>
              </div>
              <div className="mt-4 text-[12px] font-medium opacity-0 group-hover:opacity-100 transition" style={{ color: r.color }}>
                Continue →
              </div>
            </button>
          ))}
        </div>

        <div className="mt-10 text-center text-[11px]" style={{ color: "var(--text-faint)" }}>
          আপনার ভূমিকা পরে পরিবর্তন করা যাবে
        </div>
      </div>
    </main>
  );
}
