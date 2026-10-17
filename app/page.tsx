import Link from "next/link";
import LandingNav from "@/components/LandingNav";
import LandingFooter from "@/components/LandingFooter";
import LandingStats from "@/components/LandingStats";
import { Button, Card, Badge } from "@/components/ui";
import { USE_CASES, FEATURES, PRICING_TIERS } from "@/lib/landing-content";

const INSTITUTION_TYPES = [
  "🏫 School",
  "🎓 College",
  "🏛️ University",
  "⚙️ Polytechnic",
  "⚕️ Medical",
  "📚 Coaching",
  "🕌 Madrasa",
  "🔬 Institute",
];

const HOW_STEPS = [
  {
    n: "1",
    title: "Register",
    bn: "নিবন্ধন",
    desc: "প্রতিষ্ঠান নিবন্ধন করুন, নিজের admin account পান।",
  },
  {
    n: "2",
    title: "Setup",
    bn: "সেটআপ",
    desc: "ক্লাস, শিক্ষক, শিক্ষার্থী যোগ করুন। রুটিন তৈরি করুন।",
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
    <main className="min-h-screen bg-canvas">
      <LandingNav />

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden px-5 md:px-8 py-16 md:py-24">
        <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-accent/10 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-accent/5 blur-[120px]" />

        <div className="relative mx-auto max-w-container text-center">
          <Badge variant="success" size="md" className="mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live — Onboarding across Bangladesh
          </Badge>

          <h1 className="text-fluid-display text-fg">
            Bangladesh&apos;s First
            <br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Multi-Tenant EdTech
            </span>
          </h1>

          <p className="mt-6 mx-auto max-w-2xl text-fluid-body-lg text-fg-muted">
            স্কুল, কলেজ, কোচিং — সবাই নিজের Admin দিয়ে নিজের প্রতিষ্ঠান
            পরিচালনা করুন। শিক্ষক, শিক্ষার্থী, অভিভাবক, টিউটর — সবার জন্য এক
            প্ল্যাটফর্ম।
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/get-started/">
              <Button size="lg" iconRight={<span aria-hidden>→</span>}>
                Register Institution
              </Button>
            </Link>
            <Link href="/hub/">
              <Button size="lg" variant="outline">
                Explore Hub
              </Button>
            </Link>
          </div>

          <div className="mt-12">
            <LandingStats />
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {INSTITUTION_TYPES.map((t) => (
              <Badge key={t} variant="muted" size="md">
                {t}
              </Badge>
            ))}
            <Badge variant="muted" size="md">
              + 40 more
            </Badge>
          </div>
        </div>
      </section>

      {/* ═══ USE CASES ═══ */}
      <section className="px-5 md:px-8 pb-20">
        <div className="mx-auto max-w-container">
          <div className="text-center">
            <h2 className="text-fluid-h2 text-fg">
              Built for everyone
              <span className="bangla block mt-2 text-fluid-body font-normal text-fg-muted">
                সবার জন্য তৈরি
              </span>
            </h2>
            <p className="mt-4 mx-auto max-w-2xl text-fluid-body text-fg-muted">
              আপনার role অনুযায়ী আলাদা dashboard, আলাদা feature — কিন্তু একই
              ইকোসিস্টেমে।
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {USE_CASES.map((uc) => (
              <Link key={uc.role} href={uc.href} className="block">
                <Card interactive padding="lg" className="h-full">
                  <div className="text-[36px] leading-none">{uc.emoji}</div>
                  <h3 className="mt-4 text-fluid-h3 text-fg">{uc.title}</h3>
                  <p className="bangla text-fluid-body-sm text-fg-muted mt-0.5">
                    {uc.titleBn}
                  </p>
                  <p className="mt-3 text-fluid-body-sm text-fg-muted leading-relaxed">
                    {uc.desc}
                  </p>
                  <div className="mt-4 text-fluid-body-sm font-semibold text-accent">
                    {uc.cta} →
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="px-5 md:px-8 pb-20">
        <div className="mx-auto max-w-container">
          <div className="text-center">
            <h2 className="text-fluid-h2 text-fg">
              Everything you need
              <span className="bangla block mt-2 text-fluid-body font-normal text-fg-muted">
                একটি প্ল্যাটফর্মে সবকিছু
              </span>
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const inner = (
                <Card
                  interactive={!!f.href}
                  padding="lg"
                  className="h-full"
                >
                  <div className="text-[28px] leading-none">{f.emoji}</div>
                  <h3 className="mt-4 text-fluid-h3 text-fg">{f.title}</h3>
                  <p className="bangla text-fluid-body-sm text-fg-muted mt-0.5">
                    {f.titleBn}
                  </p>
                  <p className="mt-3 text-fluid-body-sm text-fg-muted leading-relaxed">
                    {f.desc}
                  </p>
                  {f.href && (
                    <div className="mt-4 text-fluid-caption font-semibold text-accent">
                      Learn more →
                    </div>
                  )}
                </Card>
              );

              return f.href ? (
                <Link key={f.title} href={f.href} className="block">
                  {inner}
                </Link>
              ) : (
                <div key={f.title}>{inner}</div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="px-5 md:px-8 pb-20">
        <div className="mx-auto max-w-5xl">
          <Card variant="flat" padding="lg">
            <div className="text-center">
              <h2 className="text-fluid-h2 text-fg">
                How it works
                <span className="bangla block mt-2 text-fluid-body font-normal text-fg-muted">
                  কীভাবে কাজ করে
                </span>
              </h2>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
              {HOW_STEPS.map((s) => (
                <div key={s.n} className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-fg text-fluid-h3 font-bold shadow-elevation-2">
                    {s.n}
                  </div>
                  <h3 className="mt-4 text-fluid-h3 text-fg">{s.title}</h3>
                  <p className="bangla text-fluid-body-sm text-fg-muted mt-0.5">
                    {s.bn}
                  </p>
                  <p className="mt-2 text-fluid-body-sm text-fg-muted leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section className="px-5 md:px-8 pb-20">
        <div className="mx-auto max-w-container">
          <div className="text-center">
            <h2 className="text-fluid-h2 text-fg">
              Simple pricing
              <span className="bangla block mt-2 text-fluid-body font-normal text-fg-muted">
                সহজ মূল্য
              </span>
            </h2>
            <p className="mt-4 mx-auto max-w-2xl text-fluid-body text-fg-muted">
              ফ্রিতে শুরু করুন, বাড়লে upgrade করুন। কোনো লুকানো চার্জ নেই।
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
            {PRICING_TIERS.map((tier) => (
              <Card
                key={tier.name}
                variant={tier.highlighted ? "elevated" : "surface"}
                padding="lg"
                className={
                  tier.highlighted
                    ? "relative ring-2 ring-accent"
                    : "relative"
                }
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="accent" size="md">
                      MOST POPULAR
                    </Badge>
                  </div>
                )}

                <div className="text-fluid-body-sm font-semibold text-fg-muted uppercase tracking-wider">
                  {tier.name}
                </div>
                <div className="bangla text-fluid-body-sm text-fg-muted">
                  {tier.nameBn}
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-fluid-h2 text-fg font-bold">
                    {tier.price}
                  </span>
                  <span className="text-fluid-caption text-fg-muted">
                    {tier.period}
                  </span>
                </div>

                <ul className="mt-6 space-y-2.5">
                  {tier.features.map((feat) => (
                    <li
                      key={feat}
                      className="flex items-start gap-2 text-fluid-body-sm text-fg-muted"
                    >
                      <span className="text-accent font-bold mt-0.5" aria-hidden>
                        ✓
                      </span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <Link href={tier.ctaHref} className="mt-6 block">
                  <Button
                    variant={tier.highlighted ? "primary" : "outline"}
                    fullWidth
                  >
                    {tier.cta}
                  </Button>
                </Link>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/pricing/"
              className="text-fluid-body-sm font-semibold text-accent hover:underline"
            >
              বিস্তারিত দেখুন →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="px-5 md:px-8 pb-20">
        <div className="mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-10 md:p-14 text-center text-white">
            <div className="pointer-events-none absolute -right-20 -top-20 h-[240px] w-[240px] rounded-full bg-white/10 blur-3xl" />
            <div className="relative">
              <h2 className="text-fluid-h2">
                Ready to transform your institution?
              </h2>
              <p className="mt-4 max-w-xl mx-auto text-fluid-body text-emerald-50/90">
                আজই শুরু করুন। সম্পূর্ণ ফ্রি ট্রায়াল। কোনো ক্রেডিট কার্ড লাগবে
                না।
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/get-started/">
                  <Button
                    size="lg"
                    className="!bg-white !text-emerald-700 hover:!bg-emerald-50"
                  >
                    Create Free Account →
                  </Button>
                </Link>
                <Link href="/login/">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="!text-white hover:!bg-white/15"
                  >
                    Sign in
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
