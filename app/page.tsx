import Link from "next/link";
import LandingNav from "@/components/LandingNav";
import LandingFooter from "@/components/LandingFooter";
import LandingStats from "@/components/LandingStats";
import {
  USE_CASES,
  FEATURES,
  PRICING_TIERS,
} from "@/lib/landing-content";

const INSTITUTION_TYPES = [
  { emoji: "🏫", label: "School" },
  { emoji: "🎓", label: "College" },
  { emoji: "🏛️", label: "University" },
  { emoji: "⚙️", label: "Polytechnic" },
  { emoji: "⚕️", label: "Medical" },
  { emoji: "📚", label: "Coaching" },
  { emoji: "🕌", label: "Madrasa" },
  { emoji: "🔬", label: "Institute" },
];

const HOW_STEPS = [
  {
    n: "1",
    title: "Register",
    bn: "নিবন্ধন",
    desc: "আপনার প্রতিষ্ঠান নিবন্ধন করুন এবং নিজের admin account পান।",
  },
  {
    n: "2",
    title: "Setup",
    bn: "সেটআপ",
    desc: "ক্লাস, শিক্ষক, শিক্ষার্থী যোগ করুন। নিজের রুটিন তৈরি করুন।",
  },
  {
    n: "3",
    title: "Manage",
    bn: "পরিচালনা",
    desc: "পরীক্ষা, ফি, উপস্থিতি, রিপোর্ট — সব এক জায়গায়।",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <LandingNav />

      {/* ═══ Hero ═══ */}
      <section className="relative overflow-hidden px-4 py-16 md:py-20">
        <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-emerald-200/40 to-teal-200/20 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-teal-100/40 to-emerald-100/20 blur-[100px]" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div
            className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[12px] font-medium"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface-3)",
            }}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live — Onboarding institutions across Bangladesh
          </div>

          <h1 className="mt-6 text-[34px] md:text-[52px] font-semibold leading-tight tracking-tight">
            Bangladesh&apos;s First
            <br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Multi-Tenant EdTech
            </span>
          </h1>

          <p
            className="mt-5 mx-auto max-w-2xl text-[15px] md:text-[17px] leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            স্কুল, কলেজ, কোচিং — সবাই নিজের Admin দিয়ে নিজের প্রতিষ্ঠান
            পরিচালনা করুন। শিক্ষক, শিক্ষার্থী, অভিভাবক, টিউটর — সবার জন্য এক
            প্ল্যাটফর্ম।
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/get-started/"
              className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-6 py-3 text-[14px] font-semibold text-white shadow-lg"
            >
              Register Institution →
            </Link>
            <Link
              href="/hub/"
              className="rounded-full border px-6 py-3 text-[14px] font-medium"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface-3)",
              }}
            >
              Explore Hub
            </Link>
          </div>

          <div className="mt-12">
            <LandingStats />
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-2 text-[12px]">
            {INSTITUTION_TYPES.map((t) => (
              <span
                key={t.label}
                className="rounded-full border px-3 py-1.5 font-medium"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface-3)",
                  color: "var(--text-muted)",
                }}
              >
                {t.emoji} {t.label}
              </span>
            ))}
            <span
              className="rounded-full border px-3 py-1.5 font-medium"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface-3)",
                color: "var(--text-muted)",
              }}
            >
              + 40 more
            </span>
          </div>
        </div>
      </section>

      {/* ═══ Use Cases ═══ */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-[26px] md:text-[32px] font-semibold tracking-tight">
              Built for everyone
              <span
                className="bangla block mt-1 text-[16px] font-normal"
                style={{ color: "var(--text-muted)" }}
              >
                সবার জন্য তৈরি
              </span>
            </h2>
            <p
              className="mt-3 mx-auto max-w-2xl text-[14px] leading-relaxed"
              style={{ color: "var(--text-muted)" }}
            >
              আপনার role অনুযায়ী আলাদা dashboard, আলাদা feature — কিন্তু একই
              ইকোসিস্টেমে।
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {USE_CASES.map((uc) => (
              <Link
                key={uc.role}
                href={uc.href}
                className="group rounded-2xl border p-6 transition hover:-translate-y-0.5 hover:shadow-lg"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface-3)",
                }}
              >
                <div className="text-[36px]">{uc.emoji}</div>
                <div className="mt-3 text-[15px] font-semibold">
                  {uc.title}
                </div>
                <div
                  className="bangla text-[12px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {uc.titleBn}
                </div>
                <p
                  className="mt-3 text-[12px] leading-relaxed"
                  style={{ color: "var(--text-muted)" }}
                >
                  {uc.desc}
                </p>
                <div className="mt-4 text-[12px] font-semibold text-emerald-600 group-hover:translate-x-0.5 transition-transform">
                  {uc.cta} →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Features ═══ */}
      <section id="features" className="px-4 pb-16">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-[26px] md:text-[32px] font-semibold tracking-tight">
              Everything you need
              <span
                className="bangla block mt-1 text-[16px] font-normal"
                style={{ color: "var(--text-muted)" }}
              >
                একটি প্ল্যাটফর্মে সবকিছু
              </span>
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const content = (
                <>
                  <div className="text-[28px]">{f.emoji}</div>
                  <div className="mt-3 text-[15px] font-semibold">
                    {f.title}
                  </div>
                  <div
                    className="bangla text-[12px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {f.titleBn}
                  </div>
                  <p
                    className="mt-2 text-[12px] leading-relaxed"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {f.desc}
                  </p>
                  {f.href && (
                    <div className="mt-3 text-[11px] font-semibold text-emerald-600">
                      Learn more →
                    </div>
                  )}
                </>
              );

              const className =
                "group rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-lg";
              const style = {
                borderColor: "var(--border)",
                background: "var(--surface-3)",
              };

              return f.href ? (
                <Link
                  key={f.title}
                  href={f.href}
                  className={className}
                  style={style}
                >
                  {content}
                </Link>
              ) : (
                <div key={f.title} className={className} style={style}>
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ How it works ═══ */}
      <section className="px-4 pb-16">
        <div
          className="mx-auto max-w-5xl rounded-3xl border p-8 md:p-12"
          style={{
            borderColor: "var(--border)",
            background: "var(--surface-3)",
          }}
        >
          <h2 className="text-[24px] md:text-[30px] font-semibold text-center tracking-tight">
            How it works
            <span
              className="bangla block mt-1 text-[15px] font-normal"
              style={{ color: "var(--text-muted)" }}
            >
              কীভাবে কাজ করে
            </span>
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {HOW_STEPS.map((s) => (
              <div key={s.n} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-[18px] font-bold shadow-lg">
                  {s.n}
                </div>
                <div className="mt-4 text-[15px] font-semibold">{s.title}</div>
                <div
                  className="bangla text-[12px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {s.bn}
                </div>
                <p
                  className="mt-2 text-[12px] leading-relaxed"
                  style={{ color: "var(--text-muted)" }}
                >
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Pricing preview ═══ */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-[26px] md:text-[32px] font-semibold tracking-tight">
              Simple pricing
              <span
                className="bangla block mt-1 text-[16px] font-normal"
                style={{ color: "var(--text-muted)" }}
              >
                সহজ মূল্য
              </span>
            </h2>
            <p
              className="mt-3 mx-auto max-w-2xl text-[14px] leading-relaxed"
              style={{ color: "var(--text-muted)" }}
            >
              ফ্রিতে শুরু করুন, বাড়লে upgrade করুন। কোনো লুকানো চার্জ নেই।
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl border p-6 relative transition ${
                  tier.highlighted ? "ring-2 ring-emerald-500 shadow-xl" : ""
                }`}
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface-3)",
                }}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-1 text-[10px] font-bold text-white shadow">
                    MOST POPULAR
                  </div>
                )}
                <div className="text-[13px] font-semibold">{tier.name}</div>
                <div
                  className="bangla text-[11px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {tier.nameBn}
                </div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-[28px] font-bold">{tier.price}</span>
                  <span
                    className="text-[12px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {tier.period}
                  </span>
                </div>
                <ul className="mt-5 space-y-2">
                  {tier.features.map((feat) => (
                    <li
                      key={feat}
                      className="flex items-start gap-2 text-[12px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.ctaHref}
                  className={`mt-6 block w-full rounded-full px-4 py-2.5 text-center text-[13px] font-semibold transition ${
                    tier.highlighted
                      ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg"
                      : "border"
                  }`}
                  style={
                    tier.highlighted ? {} : { borderColor: "var(--border)" }
                  }
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>

          <div
            className="mt-6 text-center text-[12px]"
            style={{ color: "var(--text-muted)" }}
          >
            সব plan-এ{" "}
            <Link
              href="/pricing/"
              className="font-semibold text-emerald-600 hover:underline"
            >
              বিস্তারিত দেখুন →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ Final CTA ═══ */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-8 md:p-12 text-white text-center relative overflow-hidden">
          <div className="pointer-events-none absolute -right-20 -top-20 h-[220px] w-[220px] rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <h2 className="text-[24px] md:text-[32px] font-semibold tracking-tight">
              Ready to transform your institution?
            </h2>
            <p className="mt-3 max-w-xl mx-auto text-[14px] leading-relaxed text-emerald-50/90">
              আজই শুরু করুন। সম্পূর্ণ ফ্রি ট্রায়াল। কোনো ক্রেডিট কার্ড লাগবে না।
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/get-started/"
                className="rounded-full bg-white px-6 py-3 text-[14px] font-semibold text-emerald-700 shadow"
              >
                Create Free Account →
              </Link>
              <Link
                href="/login/"
                className="rounded-full bg-white/15 px-6 py-3 text-[14px] font-medium backdrop-blur hover:bg-white/20"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
