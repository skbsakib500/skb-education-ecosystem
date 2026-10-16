import Link from "next/link";

export default function Home() {
  const features = [
    { icon: "🏛️", title: "Multi-Tenant", bn: "বহু-প্রতিষ্ঠান", desc: "এক সফটওয়্যার — অসংখ্য স্কুল, কলেজ, কোচিং" },
    { icon: "👥", title: "Role-Based", bn: "ভূমিকা-ভিত্তিক", desc: "Admin, Teacher, Student, Parent আলাদা dashboard" },
    { icon: "📚", title: "NCTB Aligned", bn: "এনসিটিবি কারিকুলাম", desc: "Class 8-12 এর জন্য প্রস্তুত" },
    { icon: "🔐", title: "Secure", bn: "সুরক্ষিত", desc: "Row-Level Security দিয়ে সম্পূর্ণ data isolation" },
    { icon: "🎓", title: "Examination", bn: "পরীক্ষা", desc: "MCQ + CQ, auto-grading, ফলাফল" },
    { icon: "💳", title: "Finance", bn: "ফি ব্যবস্থাপনা", desc: "বেতন, বকেয়া, রসিদ, রিপোর্ট" },
  ];

  const institutionTypes = [
    { emoji: "🏫", label: "School" },
    { emoji: "🎓", label: "College" },
    { emoji: "🏛️", label: "University" },
    { emoji: "⚙️", label: "Polytechnic" },
    { emoji: "⚕️", label: "Medical" },
    { emoji: "📚", label: "Coaching" },
    { emoji: "🕌", label: "Madrasa" },
    { emoji: "🔬", label: "Institute" },
  ];

  return (
    <main className="min-h-screen">
      {/* Nav */}
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
            <Link href="/login" className="rounded-full border px-4 py-1.5 text-[13px] font-medium"
              style={{ borderColor: "var(--border)" }}>
              Sign in
            </Link>
            <Link href="/signup"
              className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-1.5 text-[13px] font-semibold text-white shadow-lg">
              Get Started →
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-16 md:py-24">
        <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-emerald-200/40 to-teal-200/20 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-teal-100/40 to-emerald-100/20 blur-[100px]" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[12px] font-medium"
            style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Phase 2 Live — Authentication + Multi-Tenant
          </div>

          <h1 className="mt-6 text-[34px] md:text-[52px] font-semibold leading-tight tracking-tight">
            Build the Infrastructure.
            <br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Empower Every Institution.
            </span>
          </h1>

          <p className="mt-5 mx-auto max-w-2xl text-[15px] md:text-[17px] leading-relaxed"
            style={{ color: "var(--text-muted)" }}>
            একটি কেন্দ্রীয় প্রযুক্তি প্ল্যাটফর্ম — স্কুল, কলেজ, বিশ্ববিদ্যালয়, কোচিং সেন্টার — সবাই নিজের Admin দিয়ে নিজের প্রতিষ্ঠান পরিচালনা করবে।
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/signup"
              className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-6 py-3 text-[14px] font-semibold text-white shadow-lg">
              Register Institution →
            </Link>
            <Link href="/login"
              className="rounded-full border px-6 py-3 text-[14px] font-medium"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              Sign in
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-2 text-[12px]">
            {institutionTypes.map((t) => (
              <span key={t.label}
                className="rounded-full border px-3 py-1.5 font-medium"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)", color: "var(--text-muted)" }}>
                {t.emoji} {t.label}
              </span>
            ))}
            <span className="rounded-full border px-3 py-1.5 font-medium"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)", color: "var(--text-muted)" }}>
              + 40 more
            </span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-[26px] md:text-[32px] font-semibold tracking-tight">
              Everything you need
              <span className="bangla block mt-1 text-[16px] font-normal" style={{ color: "var(--text-muted)" }}>
                একটি প্ল্যাটফর্মে সবকিছু
              </span>
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title}
                className="group rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <div className="text-[28px]">{f.icon}</div>
                <div className="mt-3 text-[15px] font-semibold">{f.title}</div>
                <div className="bangla text-[12px]" style={{ color: "var(--text-muted)" }}>{f.bn}</div>
                <p className="mt-2 text-[12px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-5xl rounded-3xl border p-8 md:p-12"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <h2 className="text-[24px] md:text-[30px] font-semibold text-center tracking-tight">
            How it works
            <span className="bangla block mt-1 text-[15px] font-normal" style={{ color: "var(--text-muted)" }}>
              কীভাবে কাজ করে
            </span>
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { n: "1", title: "Register", bn: "নিবন্ধন", desc: "আপনার প্রতিষ্ঠান নিবন্ধন করুন এবং নিজের admin account পান।" },
              { n: "2", title: "Setup", bn: "সেটআপ", desc: "ক্লাস, শিক্ষক, শিক্ষার্থী যোগ করুন। নিজের রুটিন তৈরি করুন।" },
              { n: "3", title: "Manage", bn: "পরিচালনা", desc: "পরীক্ষা, ফি, উপস্থিতি, রিপোর্ট — সব এক জায়গায়।" },
            ].map((s) => (
              <div key={s.n} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-[18px] font-bold shadow-lg">
                  {s.n}
                </div>
                <div className="mt-4 text-[15px] font-semibold">{s.title}</div>
                <div className="bangla text-[12px]" style={{ color: "var(--text-muted)" }}>{s.bn}</div>
                <p className="mt-2 text-[12px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
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
              <Link href="/signup"
                className="rounded-full bg-white px-6 py-3 text-[14px] font-semibold text-emerald-700 shadow">
                Create Free Account →
              </Link>
              <Link href="/login"
                className="rounded-full bg-white/15 px-6 py-3 text-[14px] font-medium backdrop-blur hover:bg-white/20">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-4 py-8" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-3 text-[12px]"
          style={{ color: "var(--text-faint)" }}>
          <div>© 2025 SKB Education Ecosystem • Phase 2</div>
          <div className="flex items-center gap-3">
            <span className="bangla">বাংলাদেশ • NCTB অনুমোদিত কন্টেন্ট</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
