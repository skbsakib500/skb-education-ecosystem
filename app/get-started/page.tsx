"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ROLES } from "@/lib/onboarding";

export default function GetStartedPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/hub/");
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 size={28} className="animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
            <ArrowLeft size={16} /> Home
          </Link>
          <Link href="/login/" className="text-sm font-medium text-slate-600 hover:text-emerald-600">
            Sign in
          </Link>
        </div>

        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[12px] font-medium text-slate-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Get started · শুরু করুন
          </div>
          <h1 className="mt-5 text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
            আপনি কে? <span className="font-normal text-slate-500">· What describes you best?</span>
          </h1>
          <p className="mt-3 text-sm md:text-base text-slate-500 max-w-xl mx-auto">
            আপনার ভূমিকা অনুযায়ী আমরা signup ও onboarding সাজাবো — যাতে অপ্রয়োজনীয় ধাপ এড়িয়ে যান।
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ROLES.map((r) => (
            <Link
              key={r.key}
              href={`/signup/?role=${r.key}`}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-1 hover:shadow-xl hover:border-slate-300"
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
                <div className="text-base font-semibold text-slate-900">{r.label}</div>
                <div className="text-[13px] text-slate-500">{r.bn}</div>
                <div className="mt-2 text-[12px] leading-relaxed text-slate-500">{r.desc}</div>
              </div>
              <div
                className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold opacity-0 group-hover:opacity-100 transition"
                style={{ color: r.color }}
              >
                Continue <ArrowRight size={13} />
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-center text-[12px] text-slate-400">
          ভূমিকা পরে profile থেকে পরিবর্তন করা যাবে · You can change this later
        </p>
        <p className="mt-2 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login/" className="font-semibold text-emerald-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
