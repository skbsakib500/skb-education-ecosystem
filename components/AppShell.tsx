"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Menu, Bell, LogOut, ChevronDown, Building2, Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  SIDEBAR_SECTIONS, BOTTOM_NAV, isPublicRoute, canShowItem, isActivePath,
  type NavItem,
} from "@/lib/nav";

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  primary_role: string | null;
  sub_role: string | null;
};

type Membership = {
  institution_id: string;
  role: string;
  institutions: { name: string; slug: string; emoji: string | null } | null;
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const router = useRouter();

  const isPublic = isPublicRoute(pathname);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [instMenuOpen, setInstMenuOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [currentInst, setCurrentInst] = useState<string>("");
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isPublic) { setLoading(false); return; }
    let cancelled = false;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) { setLoading(false); return; }

      const [profileRes, memberRes, notifRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id,full_name,avatar_url,primary_role,sub_role")
          .eq("id", user.id)
          .single(),
        supabase
          .from("memberships")
          .select("institution_id, role, institutions(name,slug,emoji)")
          .eq("user_id", user.id)
          .eq("status", "active"),
        supabase.rpc("my_unread_notifications"),
      ]);

      if (cancelled) return;

      if (profileRes.data) setProfile(profileRes.data as Profile);
      if (memberRes.data) {
        const list = memberRes.data as unknown as Membership[];
        setMemberships(list);
        if (list.length > 0) {
          const saved = typeof window !== "undefined"
            ? localStorage.getItem("skb:current_inst")
            : null;
          const found = saved ? list.find((m) => m.institution_id === saved) : null;
          setCurrentInst(found ? saved! : list[0].institution_id);
        }
      }
      if (typeof notifRes.data === "number") setUnread(notifRes.data);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [pathname, isPublic]);

  useEffect(() => {
    setSidebarOpen(false);
    setUserMenuOpen(false);
    setInstMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login/");
  };

  const switchInstitution = (id: string, slug: string) => {
    setCurrentInst(id);
    if (typeof window !== "undefined") {
      localStorage.setItem("skb:current_inst", id);
    }
    setInstMenuOpen(false);
    router.push(`/institutions/view/?slug=${slug}`);
  };

  if (isPublic) return <>{children}</>;

  const role = profile?.primary_role || null;
  const visibleSections = SIDEBAR_SECTIONS
    .map((s) => ({ ...s, items: s.items.filter((i) => canShowItem(i, role)) }))
    .filter((s) => s.items.length > 0);

  const currentMembership = memberships.find(
    (m) => m.institution_id === currentInst
  );

  return (
    <div className="min-h-screen bg-canvas">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col fixed inset-y-0 left-0 w-64 bg-slate-950 text-slate-100 z-40 border-r border-slate-800">
        <SidebarContent
          pathname={pathname}
          sections={visibleSections}
          profile={profile}
        />
      </aside>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-64 bg-slate-950 text-slate-100 z-50 md:hidden flex flex-col">
            <SidebarContent
              pathname={pathname}
              sections={visibleSections}
              profile={profile}
              onNavigate={() => setSidebarOpen(false)}
            />
          </aside>
        </>
      )}

      {/* Topbar */}
      <header className="fixed top-0 left-0 right-0 md:left-64 h-14 bg-surface-solid border-b border-border z-30 flex items-center px-3 md:px-6 gap-2 md:gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden p-2 rounded-lg hover:bg-surface-hover text-fg transition-colors duration-fast"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <Link href="/hub/" className="md:hidden font-bold text-fg">
          SKB
        </Link>

        {/* Institution switcher */}
        <div className="relative">
          <button
            onClick={() => setInstMenuOpen((v) => !v)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-hover text-fluid-body-sm text-fg transition-colors duration-fast"
          >
            <Building2 size={16} className="text-fg-muted" />
            <span className="max-w-[140px] truncate font-medium">
              {currentMembership?.institutions?.name || "No institution"}
            </span>
            <ChevronDown size={14} className="text-fg-muted" />
          </button>

          {instMenuOpen && memberships.length > 0 && (
            <div className="absolute top-full mt-1 left-0 w-64 bg-surface-solid border border-border rounded-xl shadow-elevation-3 py-1 z-50">
              {memberships.map((m) => (
                <button
                  key={m.institution_id}
                  onClick={() =>
                    switchInstitution(m.institution_id, m.institutions?.slug || "")
                  }
                  className="w-full text-left px-3 py-2 hover:bg-surface-hover text-fluid-body-sm flex items-center gap-2 transition-colors duration-fast"
                >
                  <span className="text-lg">{m.institutions?.emoji || "🏫"}</span>
                  <span className="flex-1 truncate text-fg">{m.institutions?.name}</span>
                  <span className="text-fluid-caption text-fg-muted capitalize">{m.role}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1" />

        <Link
          href="/achievements/"
          className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-surface-hover text-fluid-body-sm text-amber-600 dark:text-amber-400 font-medium transition-colors duration-fast"
        >
          <Sparkles size={15} />
          <span>Points</span>
        </Link>

        <Link
          href="/settings/notifications/"
          className="relative p-2 rounded-lg hover:bg-surface-hover text-fg transition-colors duration-fast"
          aria-label="Notifications"
        >
          <Bell size={19} />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 rounded-full bg-danger text-white text-fluid-micro font-bold flex items-center justify-center leading-none">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Link>

        <div className="relative">
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-surface-hover transition-colors duration-fast"
            aria-label="User menu"
          >
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt=""
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-accent text-accent-fg flex items-center justify-center text-fluid-body-sm font-semibold">
                {(profile?.full_name || "U").charAt(0).toUpperCase()}
              </div>
            )}
          </button>

          {userMenuOpen && (
            <div className="absolute top-full right-0 mt-1 w-56 bg-surface-solid border border-border rounded-xl shadow-elevation-3 py-1 z-50">
              <div className="px-3 py-2 border-b border-border">
                <div className="text-fluid-body-sm font-semibold text-fg truncate">
                  {profile?.full_name || "User"}
                </div>
                <div className="text-fluid-caption text-fg-muted capitalize">
                  {role || "member"}
                </div>
              </div>
              <Link href="/profile/" className="block px-3 py-2 text-fluid-body-sm text-fg hover:bg-surface-hover transition-colors duration-fast">
                My Profile
              </Link>
              <Link href="/settings/notifications/" className="block px-3 py-2 text-fluid-body-sm text-fg hover:bg-surface-hover transition-colors duration-fast">
                Settings
              </Link>
              <Link href="/dashboard/" className="block px-3 py-2 text-fluid-body-sm text-fg hover:bg-surface-hover transition-colors duration-fast">
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-fluid-body-sm text-danger hover:bg-surface-hover flex items-center gap-2 border-t border-border mt-1 transition-colors duration-fast"
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="md:pl-64 pt-14 pb-20 md:pb-4 min-h-screen">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-fg-muted text-fluid-body-sm">
            Loading…
          </div>
        ) : (
          children
        )}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-solid border-t border-border z-30 grid grid-cols-5">
        {BOTTOM_NAV.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 text-fluid-micro transition-colors duration-fast ${
                active ? "text-accent font-semibold" : "text-fg-muted"
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function SidebarContent({
  pathname, sections, profile, onNavigate,
}: {
  pathname: string;
  sections: { title: string; items: NavItem[] }[];
  profile: Profile | null;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="h-14 flex items-center px-4 border-b border-slate-800 shrink-0">
        <Link href="/hub/" className="flex items-center gap-2.5" onClick={onNavigate}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-fluid-body-sm shadow-elevation-1">
            SKB
          </div>
          <span className="font-bold text-fluid-body">SKB Education</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-3">
        {sections.map((section) => (
          <div key={section.title} className="mb-4">
            <div className="px-4 py-1.5 text-fluid-micro font-semibold uppercase tracking-wider text-slate-400">
              {section.title}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`mx-2 px-3 py-2 rounded-lg flex items-center gap-3 text-fluid-body-sm transition-colors duration-fast ${
                    active
                      ? "bg-emerald-600/20 text-emerald-300"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {profile && (
        <div className="p-3 border-t border-slate-800 shrink-0">
          <div className="flex items-center gap-2 px-2 py-1.5">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt=""
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-fluid-body-sm font-semibold">
                {(profile.full_name || "U").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-fluid-body-sm font-medium truncate text-slate-100">
                {profile.full_name || "User"}
              </div>
              <div className="text-fluid-caption text-slate-400 capitalize">
                {profile.primary_role || "member"}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
