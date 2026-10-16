"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function PricingPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cycle, setCycle] = useState<"monthly"|"yearly">("monthly");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("subscription_plans")
        .select("*").eq("is_public", true).eq("is_active", true).order("sort_order");
      setPlans(data ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <main className="min-h-screen pb-16">
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
          <div className="flex gap-2">
            <Link href="/login" className="rounded-full border px-4 py-1.5 text-[13px]"
              style={{ borderColor: "var(--border)" }}>Sign in</Link>
            <Link href="/signup" className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-1.5 text-[13px] font-semibold text-white">
              Start Free →
            </Link>
          </div>
        </div>
      </header>

      <section className="px-4 py-16 md:py-20">
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[12px] font-medium"
            style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            14-day free trial · No credit card
          </div>
          <h1 className="mt-6 text-[34px] md:text-[48px] font-semibold leading-tight">
            Simple pricing for
            <span className="bangla block text-[24px] md:text-[32px] mt-1 font-normal" style={{ color: "var(--text-muted)" }}>
              প্রতিষ্ঠানের সব আকারের জন্য
            </span>
          </h1>

          <div className="mt-8 inline-flex rounded-full border p-1"
            style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            <button onClick={() => setCycle("monthly")}
              className={"rounded-full px-5 py-2 text-[13px] font-medium " + (cycle === "monthly" ? "bg-[var(--text)] text-[var(--bg)]" : "")}
              style={cycle !== "monthly" ? { color: "var(--text-muted)" } : {}}>Monthly</button>
            <button onClick={() => setCycle("yearly")}
              className={"rounded-full px-5 py-2 text-[13px] font-medium " + (cycle === "yearly" ? "bg-[var(--text)] text-[var(--bg)]" : "")}
              style={cycle !== "yearly" ? { color: "var(--text-muted)" } : {}}>
              Yearly <span className="text-[10px] text-emerald-600">(Save 17%)</span>
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-6xl mt-12">
          {loading ? (
            <div className="text-center py-10">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((p, i) => {
                const colors = ["#64748b", "#10b981", "#8b5cf6", "#f59e0b"];
                const color = colors[i % colors.length];
                const isPopular = p.code === "pro";
                const price = cycle === "yearly" ? Number(p.price_bdt) * 10 : Number(p.price_bdt);
                return (
                  <div key={p.id}
                    className={"rounded-2xl border p-6 relative " + (isPopular ? "shadow-xl -translate-y-2" : "")}
                    style={{ borderColor: isPopular ? color : "var(--border)", background: "var(--surface-3)" }}>
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white"
                        style={{ background: color }}>Most Popular</div>
                    )}
                    <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>{p.code}</div>
                    <div className="mt-2 text-[22px] font-bold">{p.name}</div>
                    <div className="bangla text-[12px]" style={{ color: "var(--text-muted)" }}>{p.name_bn}</div>
                    <div className="mt-4">
                      <span className="text-[32px] font-bold" style={{ color }}>৳{Number(price).toLocaleString()}</span>
                      <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                        /{cycle === "yearly" ? "year" : "month"}
                      </span>
                    </div>
                    <Link href={"/signup?plan=" + p.code}
                      className="mt-5 block rounded-full py-2.5 text-center text-[13px] font-semibold"
                      style={isPopular
                        ? { background: "linear-gradient(135deg," + color + "," + color + "cc)", color: "white" }
                        : { background: "var(--bg-soft)", color: "var(--text)" }}>
                      {p.price_bdt === 0 ? "Start Free" : "Get Started"}
                    </Link>
                    <div className="mt-5 pt-4 border-t space-y-2" style={{ borderColor: "var(--border)" }}>
                      <LimitRow label="Students" value={p.max_students} />
                      <LimitRow label="Teachers" value={p.max_teachers} />
                      <LimitRow label="Classes" value={p.max_classes} />
                      <LimitRow label="Storage" value={p.max_storage_mb + " MB"} />
                    </div>
                    {p.features && (
                      <div className="mt-4 pt-4 border-t space-y-1.5" style={{ borderColor: "var(--border)" }}>
                        {Object.entries(p.features).map(([k, v]: any) => (
                          <div key={k} className="flex items-center gap-2 text-[11px]">
                            <span style={{ color: v ? color : "#94a3b8" }}>{v ? "✓" : "✕"}</span>
                            <span style={{ color: v ? "var(--text)" : "var(--text-muted)" }} className="capitalize">
                              {k.replace("_", " ")}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mx-auto max-w-3xl mt-16 rounded-2xl border p-6 text-center"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <h3 className="text-[18px] font-semibold">Need a custom plan?</h3>
          <p className="bangla text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>
            বড় প্রতিষ্ঠানের জন্য বিশেষ package তৈরি করি
          </p>
          <a href="mailto:msakibalmhamud5@gmail.com" className="mt-4 inline-block rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-6 py-2.5 text-[13px] font-semibold text-white">
            Contact Sales
          </a>
        </div>
      </section>
    </main>
  );
}

function LimitRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between text-[12px]">
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="font-semibold">{typeof value === "number" ? value.toLocaleString() : value}</span>
    </div>
  );
}
