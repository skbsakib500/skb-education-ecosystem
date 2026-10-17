import {
  Home, LayoutDashboard, Newspaper, MessageSquare,
  GraduationCap, BookOpen, Users, MessageCircle,
  BookMarked, FolderOpen, UserCheck, Briefcase,
  ShoppingBag, Trophy, BarChart3, Sparkles,
  User, Bell, CreditCard, Compass, Shield,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: string[];
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const SIDEBAR_SECTIONS: NavSection[] = [
  {
    title: "Main",
    items: [
      { label: "Home",        href: "/",           icon: Home },
      { label: "Super Hub",   href: "/hub/",       icon: Home },
      { label: "Dashboard",   href: "/dashboard/", icon: LayoutDashboard },
      { label: "Feed",        href: "/feed/",      icon: Newspaper },
      { label: "Messages",    href: "/messages/",  icon: MessageSquare },
      { label: "Explore",     href: "/explore/",   icon: Compass },
    ],
  },
  {
    title: "My Portals",
    items: [
      { label: "Student", href: "/student/", icon: GraduationCap, roles: ["student"] },
      { label: "Teacher", href: "/teacher/", icon: BookOpen,      roles: ["teacher"] },
      { label: "Parent",  href: "/parent/",  icon: Users,         roles: ["parent"] },
    ],
  },
  {
    title: "Community",
    items: [
      { label: "Discussions", href: "/discussions/", icon: MessageCircle },
      { label: "Journals",    href: "/journals/",    icon: BookMarked },
      { label: "Materials",   href: "/materials/",   icon: FolderOpen },
    ],
  },
  {
    title: "Marketplace",
    items: [
      { label: "Tutors",      href: "/tutors/",      icon: UserCheck },
      { label: "Jobs",        href: "/jobs/",        icon: Briefcase },
      { label: "Marketplace", href: "/marketplace/", icon: ShoppingBag },
    ],
  },
  {
    title: "Progress",
    items: [
      { label: "Achievements", href: "/achievements/", icon: Trophy },
      { label: "Leaderboard",  href: "/leaderboard/",  icon: BarChart3 },
    ],
  },
  {
    title: "AI Tools",
    items: [
      { label: "AI Tutor", href: "/ai-tutor/", icon: Sparkles },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Profile",       href: "/profile/",               icon: User },
      { label: "Privacy",       href: "/settings/privacy/",       icon: Shield },
      { label: "Notifications", href: "/settings/notifications/", icon: Bell },
      { label: "Pricing",       href: "/pricing/",               icon: CreditCard },
    ],
  },
];

export const BOTTOM_NAV: NavItem[] = [
  { label: "Hub",      href: "/hub/",      icon: Home },
  { label: "Feed",     href: "/feed/",     icon: Newspaper },
  { label: "AI",       href: "/ai-tutor/", icon: Sparkles },
  { label: "Messages", href: "/messages/", icon: MessageSquare },
  { label: "Profile",  href: "/profile/",  icon: User },
];

export const PUBLIC_ROUTES: string[] = [
  "/get-started/",
  "/auth/callback/",
  "/login/",
  "/signup/",
  "/forgot-password/",
  "/reset-password/",
  "/join/",
  "/admission/",
  "/verify/",
  "/pay/",
  "/u/",
];

export function isPublicRoute(pathname: string): boolean {
  if (pathname === "/" || pathname === "") return true;
  return PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
}

export function canShowItem(item: NavItem, role: string | null): boolean {
  if (!item.roles || item.roles.length === 0) return true;
  if (!role) return false;
  return item.roles.includes(role);
}

export function isActivePath(pathname: string, href: string): boolean {
  const clean = href.replace(/\/$/, "");
  const cur = pathname.replace(/\/$/, "");
  return cur === clean || cur.startsWith(clean + "/");
}
