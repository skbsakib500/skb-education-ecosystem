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
    <footer className="border-t bg-surface" style={{ borderColor: "var(--color-border)" }}>
      <div className="mx-auto max-w-container px-5 md:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-fluid-body-sm shadow-elevation-1">
                SKB
              </div>
              <div className="leading-tight">
                <div className="text-fluid-body-sm font-semibold text-fg">
                  SKB Education
                </div>
                <div className="bangla text-fluid-micro text-fg-muted">
                  জ্ঞানের ইকোসিস্টেম
                </div>
              </div>
            </Link>
            <p className="mt-3 text-fluid-caption text-fg-muted leading-relaxed">
              Bangladesh&apos;s first multi-tenant EdTech platform.
            </p>
          </div>

          {/* Link columns */}
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="text-fluid-micro font-semibold uppercase tracking-wider mb-3 text-fg-muted">
                {col.title}
              </div>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-fluid-caption text-fg hover:text-accent transition-colors duration-fast"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="my-8 border-t" style={{ borderColor: "var(--color-border)" }} />

        {/* Disclaimer */}
        <div className="mb-6 rounded-xl border px-4 py-3 text-fluid-caption leading-relaxed bg-canvas-soft text-fg-muted" style={{ borderColor: "var(--color-border)" }}>
          <span className="font-semibold text-fg">Disclaimer:</span>{" "}
          SKB Education Ecosystem is an independent educational initiative. We
          are not affiliated with, endorsed by, or officially connected to the{" "}
          <span className="font-semibold">National Curriculum and Textbook Board (NCTB)</span>{" "}
          of Bangladesh. NCTB textbooks and syllabus references are used here
          for educational and reference purposes only, under fair use for
          non-commercial curriculum alignment.
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-fluid-caption text-fg-subtle">
          <div>© {new Date().getFullYear()} SKB Education Ecosystem. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <span className="bangla">বাংলাদেশ • NCTB কারিকুলাম-সংগতিপূর্ণ</span>
            <span className="hidden md:inline">•</span>
            <span>Made for Bangladesh 🇧🇩</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
