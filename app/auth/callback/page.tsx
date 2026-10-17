"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { isValidRole } from "@/lib/roles";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <CallbackInner />
    </Suspense>
  );
}

function Spinner() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-canvas-soft">
      <Loader2 size={32} className="animate-spin text-emerald-600" />
      <p className="text-fluid-body-sm text-fg-muted">Verifying your email…</p>
    </main>
  );
}

function CallbackInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let finished = false;

    const finish = (session: any) => {
      if (finished) return;
      finished = true;

      const metaRole = session?.user?.user_metadata?.intended_role;
      const target =
        next && next.startsWith("/")
          ? next
          : isValidRole(metaRole)
          ? `/onboarding/${metaRole}/`
          : "/onboarding/";

      router.replace(target);
    };

    // supabase-js parses #access_token automatically (detectSessionInUrl)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) finish(data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) finish(session);
    });

    const timer = setTimeout(async () => {
      if (finished) return;
      const { data } = await supabase.auth.getSession();
      if (data.session) finish(data.session);
      else {
        finished = true;
        setFailed(true);
      }
    }, 7000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [next, router]);

  if (!failed) return <Spinner />;

  return (
    <main className="min-h-screen flex items-center justify-center bg-canvas-soft px-4">
      <div className="max-w-md w-full rounded-2xl border border-border bg-white p-8 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
          <AlertCircle size={22} />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-fg">Verification link expired</h1>
        <p className="mt-2 text-fluid-body-sm text-fg-muted">
          Link-টি কাজ করেনি বা মেয়াদ শেষ। আবার sign in করুন, অথবা নতুন confirmation email নিন।
        </p>
        <div className="mt-6 space-y-2">
          <Link
            href="/login/"
            className="block w-full rounded-xl bg-slate-900 py-2.5 text-fluid-body-sm font-semibold text-white hover:bg-slate-800"
          >
            Go to sign in
          </Link>
          <Link
            href="/signup/"
            className="block w-full rounded-xl border border-border-strong py-2.5 text-fluid-body-sm font-medium text-fg hover:bg-canvas-soft"
          >
            Sign up again
          </Link>
        </div>
      </div>
    </main>
  );
}
