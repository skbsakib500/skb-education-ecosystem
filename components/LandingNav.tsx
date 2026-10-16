"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/lib/auth";

const NAV_LINKS = [
  { label: "Home",        href: "/" },
  { label: "Pricing",     href: "/pricing/" },
  { label: "Tutors",      href: "/tutors/" },
  { label: "Jobs",        href: "/jobs/" },
  { label: "Discussions", href: "/discussions/" },
  { label: "Marketplace", href: "/marketplace/" },
];

export default function LandingNav() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  const isAuthed = !loading && !!user;

  return (
    <header
      className="sticky top-0 z-30 border-b"
      style={{
        borderColor: "var(--border)",
        background: "var(--surface)",
        backdropFilter: "blur(24px)",
      }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-[13px] shadow-lg">
            SKB
          </div>
          <div className="leading-tight">
            <div className="text-[14px] font-semibold">SKB Education</div>
            <div
              className="bangla text-[11px]"
              style={{ color: "var(--text-muted)" }}
            >
              জ্ঞানের ইকোসিস্টেম
            </div>
          </div>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 rounded-full text-[13px] font-medium hover:bg-slate-100 transition-colors"
              style={{ color: "var(--text)" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden lg:flex items-center gap-2">
          {isAuthed ? (
            <Link
              href="/hub/"
              className="flex items-center gap-2 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-1.5 text-[13px] font-semibold text-white shadow-lg"
            >
              <LayoutDashboard size={14} />
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login/"
                className="rounded-full border px-4 py-1.5 text-[13px] font-medium"
                style={{ borderColor: "var(--border)" }}
              >
                Sign in
              </Link>
              <Link
                href="/signup/"
                className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-1.5 text-[13px] font-semibold text-white shadow-lg"
              >
                Get Started →
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
          aria-label="Menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div
          className="lg:hidden border-t"
          style={{
            borderColor: "var(--border)",
            background: "var(--surface)",
          }}
        >
          <nav className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-100"
                style={{ color: "var(--text)" }}
              >
                {link.label}
              </Link>
            ))}

            <div className="border-t my-2" style={{ borderColor: "var(--border)" }} />

            {isAuthed ? (
              <Link
                href="/hub/"
                className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white"
              >
                <LayoutDashboard size={15} />
                Open Dashboard
              </Link>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login/"
                  className="rounded-full border px-4 py-2.5 text-sm font-medium text-center"
                  style={{ borderColor: "var(--border)" }}
                >
                  Sign in
                </Link>
                <Link
                  href="/signup/"
                  className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white text-center"
                >
                  Get Started →
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
