"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui";

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
      className="sticky top-0 z-30 border-b bg-surface"
      style={{ borderColor: "var(--color-border)", backdropFilter: "blur(24px)" }}
    >
      <div className="mx-auto flex h-16 max-w-container items-center justify-between px-5 md:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3">
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

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 rounded-full text-fluid-body-sm font-medium text-fg hover:bg-surface-hover transition-colors duration-fast"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden lg:flex items-center gap-2">
          {isAuthed ? (
            <Link href="/hub/">
              <Button size="sm" iconLeft={<LayoutDashboard size={14} />}>
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login/">
                <Button size="sm" variant="outline">
                  Sign in
                </Button>
              </Link>
              <Link href="/get-started/">
                <Button size="sm" iconRight={<span aria-hidden>→</span>}>
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="lg:hidden p-2 rounded-lg text-fg hover:bg-surface-hover"
          aria-label="Menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden border-t bg-surface" style={{ borderColor: "var(--color-border)" }}>
          <nav className="mx-auto max-w-container px-4 py-3 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 rounded-lg text-fluid-body-sm font-medium text-fg hover:bg-surface-hover"
              >
                {link.label}
              </Link>
            ))}

            <div className="border-t my-2" style={{ borderColor: "var(--color-border)" }} />

            {isAuthed ? (
              <Link href="/hub/">
                <Button size="md" fullWidth iconLeft={<LayoutDashboard size={15} />}>
                  Open Dashboard
                </Button>
              </Link>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/login/">
                  <Button size="md" variant="outline" fullWidth>
                    Sign in
                  </Button>
                </Link>
                <Link href="/get-started/">
                  <Button size="md" fullWidth iconRight={<span aria-hidden>→</span>}>
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
