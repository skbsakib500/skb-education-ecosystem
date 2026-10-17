import Link from "next/link";

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features",     href: "/#features" },
      { label: "Pricing",      href: "/pricing/" },
      { label: "For Tutors",   href: "/tutors/" },
      { label: "AI Tutor",     href: "/ai-tutor/" },
    ],
  },
  {
    title: "For Users",
    links: [
      { label: "Institution Owner", href: "/signup/?role=owner" },
      { label: "Teacher",           href: "/signup/?role=teacher" },
      { label: "Student",           href: "/signup/?role=student" },
      { label: "Parent",            href: "/signup/?role=parent" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Discussions", href: "/discussions/" },
      { label: "Journals",    href: "/journals/" },
      { label: "Materials",   href: "/materials/" },
      { label: "Leaderboard", href: "/leaderboard/" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About",       href: "/about/" },
      { label: "Contact",     href: "/contact/" },
      { label: "Get Started", href: "/get-started/" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms",   href: "/terms/" },
      { label: "Privacy", href: "/privacy/" },
    ],
  },
] as const;

export default function LandingFooter() {
  return (
    <footer
      className="border-t"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <div className="mx-auto max-w-6xl px-4 md:px-8 py-12">
        {/* Top: brand + columns */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand block */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-[13px] shadow-lg">
                SKB
              </div>
              <div className="leading-tight">
                <div className="text-[13px] font-semibold">SKB Education</div>
                <div
                  className="bangla text-[10px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  জ্ঞানের ইকোসিস্টেম
                </div>
              </div>
            </Link>
            <p
              className="mt-3 text-[11px] leading-relaxed"
              style={{ color: "var(--text-muted)" }}
            >
              Bangladesh&apos;s first multi-tenant EdTech platform.
            </p>
          </div>

          {/* Link columns */}
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <div
                className="text-[11px] font-semibold uppercase tracking-wider mb-3"
                style={{ color: "var(--text-muted)" }}
              >
                {col.title}
              </div>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[12px] transition-colors hover:text-emerald-600"
                      style={{ color: "var(--text)" }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div
          className="my-8 border-t"
          style={{ borderColor: "var(--border)" }}
        />

        {/* Disclaimer strip — legal safety */}
        <div
          className="mb-6 rounded-xl border px-4 py-3 text-[11px] leading-relaxed"
          style={{
            borderColor: "var(--border)",
            background: "var(--surface-3)",
            color: "var(--text-muted)",
          }}
        >
          <span className="font-semibold" style={{ color: "var(--text)" }}>
            Disclaimer:
          </span>{" "}
          SKB Education Ecosystem is an independent educational initiative. We
          are not affiliated with, endorsed by, or officially connected to the{" "}
          <span className="font-semibold">National Curriculum and Textbook Board (NCTB)</span>{" "}
          of Bangladesh. NCTB textbooks and syllabus references are used here
          for educational and reference purposes only, under fair use for
          non-commercial curriculum alignment.
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col md:flex-row items-center justify-between gap-3 text-[11px]"
          style={{ color: "var(--text-faint)" }}
        >
          <div>
            © {new Date().getFullYear()} SKB Education Ecosystem. All rights
            reserved.
          </div>
          <div className="flex items-center gap-4">
            <span className="bangla">বাংলাদেশ • NCTB কারিকুলাম-সংগতিপূর্ণ</span>
            <span className="hidden md:inline">•</span>
            <span>Made with 💚 in Dhaka</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
