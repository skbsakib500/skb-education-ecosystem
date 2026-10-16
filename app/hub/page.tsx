"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2, GraduationCap, BookOpen, Users,
  Newspaper, MessageSquare, MessageCircle, BookMarked, FolderOpen,
  UserCheck, Briefcase, ShoppingBag,
  Trophy, BarChart3, Sparkles,
  User, Bell, CreditCard, Compass,
  ArrowRight, Plus, type LucideIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

type Institution = {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
  type: string | null;
};

type Stats = {
  institutions: number;
  isPlatformAdmin: boolean;
  isStudent: boolean;
  isTeacher: boolean;
  isParent: boolean;
};

type FeatureCard = {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  color: string;
};

type Section = {
  title: string;
  emoji: string;
  items: FeatureCard[];
};

export default function HubPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [stats, setStats] = useState<Stats>({
    institutions: 0,
    isPlatformAdmin: false,
    isStudent: false,
    isTeacher: false,
    isParent: false,
  });

  // Auth gate
  useEffect(() => {
    if (!authLoading && !user) router.push("/login/");
  }, [user, authLoading, router]);

  // Load dashboard data
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      const [profileRes, memRes, admRes, studentRes, parentRes, teacherRes] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("full_name,avatar_url,onboarding_complete")
            .eq("id", user.id)
            .maybeSingle(),
          supabase
            .from("memberships")
            .select("institution_id, role, institutions(id,name,slug,emoji,type)")
            .eq("user_id", user.id)
            .eq("status", "active"),
          supabase
            .from("platform_admins")
            .select("user_id")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("students")
            .select("id")
            .eq("linked_user_id", user.id)
            .limit(1),
          supabase
            .from("parent_student_links")
            .select("id")
            .eq("parent_user_id", user.id)
            .limit(1),
          supabase
            .from("memberships")
            .select("id")
            .eq("user_id", user.id)
            .eq("role", "teacher")
            .limit(1),
        ]);

      if (cancelled) return;

      // Onboarding gate
      if (profileRes.data && profileRes.data.onboarding_complete === false) {
        router.push("/onboarding/");
        return;
      }

      setFullName(profileRes.data?.full_name || "");
      setAvatarUrl(profileRes.data?.avatar_url || null);

      const instList: Institution[] = [];
      const seen = new Set<string>();
      (memRes.data || []).forEach((m: any) => {
        const inst = m.institutions;
        if (inst && !seen.has(inst.id)) {
          seen.add(inst.id);
          instList.push(inst);
        }
      });
      setInstitutions(instList);

      setStats({
        institutions: instList.length,
        isPlatformAdmin: !!admRes.data,
        isStudent: (studentRes.data || []).length > 0,
        isTeacher: (teacherRes.data || []).length > 0,
        isParent: (parentRes.data || []).length > 0,
      });

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, router]);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
        Loading…
      </div>
    );
  }

  // ---------- Build dynamic sections ----------
  const sections: Section[] = [];

  // Portals (role-based)
  const portalItems: FeatureCard[] = [];
  if (stats.isStudent) {
    portalItems.push({
      label: "Student Portal",
      description: "Assignments, exams, attendance, results",
      href: "/student/",
      icon: GraduationCap,
      color: "from-blue-500 to-blue-600",
    });
  }
  if (stats.isTeacher) {
    portalItems.push({
      label: "Teacher Portal",
      description: "Classes, grading, analytics, lesson plans",
      href: "/teacher/",
      icon: BookOpen,
      color: "from-emerald-500 to-emerald-600",
    });
  }
  if (stats.isParent) {
    portalItems.push({
      label: "Parent Portal",
      description: "Children progress, fees, attendance",
      href: "/parent/",
      icon: Users,
      color: "from-purple-500 to-purple-600",
    });
  }
  if (portalItems.length > 0) {
    sections.push({ title: "Your Portals", emoji: "🎓", items: portalItems });
  }

  // Social
  sections.push({
    title: "Social & Community",
    emoji: "💬",
    items: [
      { label: "Feed", description: "Posts, likes, follows", href: "/feed/", icon: Newspaper, color: "from-pink-500 to-rose-600" },
      { label: "Messages", description: "Direct conversations", href: "/messages/", icon: MessageSquare, color: "from-cyan-500 to-blue-600" },
      { label: "Discussions", description: "Q&A, best answers", href: "/discussions/", icon: MessageCircle, color: "from-indigo-500 to-indigo-600" },
      { label: "Journals", description: "Academic journals & articles", href: "/journals/", icon: BookMarked, color: "from-amber-500 to-orange-600" },
      { label: "Explore", description: "Discover people & content", href: "/explore/", icon: Compass, color: "from-teal-500 to-emerald-600" },
    ],
  });

  // Marketplace
  sections.push({
    title: "Marketplace & Knowledge",
    emoji: "🛒",
    items: [
      { label: "Tutors", description: "Find or become a tutor", href: "/tutors/", icon: UserCheck, color: "from-orange-500 to-red-500" },
      { label: "Jobs", description: "Teaching & admin jobs", href: "/jobs/", icon: Briefcase, color: "from-slate-600 to-slate-800" },
      { label: "Materials", description: "Study resources & uploads", href: "/materials/", icon: FolderOpen, color: "from-lime-500 to-green-600" },
      { label: "Marketplace", description: "Buy & sell education items", href: "/marketplace/", icon: ShoppingBag, color: "from-fuchsia-500 to-purple-600" },
    ],
  });

  // Progress
  sections.push({
    title: "Progress & Achievements",
    emoji: "🏆",
    items: [
      { label: "Achievements", description: "Badges & points", href: "/achievements/", icon: Trophy, color: "from-yellow-500 to-amber-600" },
      { label: "Leaderboard", description: "Top learners this week", href: "/leaderboard/", icon: BarChart3, color: "from-red-500 to-orange-600" },
    ],
  });

  // AI
  sections.push({
    title: "AI Tools",
    emoji: "🤖",
    items: [
      { label: "AI Tutor", description: "Ask any question, get help", href: "/ai-tutor/", icon: Sparkles, color: "from-violet-500 to-purple-600" },
    ],
  });

  // Super Admin (only if admin)
  if (stats.isPlatformAdmin) {
    sections.push({
      title: "Platform Admin",
      emoji: "🛡️",
      items: [
        { label: "Super Admin", description: "Platform controls", href: "/super-admin/", icon: Building2, color: "from-slate-700 to-slate-900" },
        { label: "Institution Requests", description: "Review new applications", href: "/super-admin/requests/", icon: UserCheck, color: "from-rose-500 to-pink-600" },
        { label: "Platform Analytics", description: "Global metrics", href: "/super-admin/analytics/", icon: BarChart3, color: "from-sky-500 to-blue-700" },
      ],
    });
  }

  // Settings
  sections.push({
    title: "Settings",
    emoji: "⚙️",
    items: [
      { label: "Profile", description: "Public profile & bio", href: "/profile/", icon: User, color: "from-slate-500 to-slate-700" },
      { label: "Notifications", description: "Alerts & preferences", href: "/settings/notifications/", icon: Bell, color: "from-blue-500 to-cyan-600" },
      { label: "Pricing & Plans", description: "Upgrade institution plan", href: "/pricing/", icon: CreditCard, color: "from-emerald-500 to-teal-600" },
    ],
  });

  const greetingName = fullName ? fullName.split(" ")[0] : "there";

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-8">
      {/* ============ Hero ============ */}
      <section className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 md:p-8 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute -right-24 top-20 w-52 h-52 bg-purple-500/20 rounded-full blur-3xl" />

        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">
              Super Hub
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">
              👋 Welcome, {greetingName}!
            </h1>
            <p className="text-slate-300 text-sm mt-2 max-w-xl">
              Everything in one place — your institution, portals, community, and AI tools.
            </p>
          </div>

          {avatarUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-white/20 object-cover"
            />
          )}
        </div>

        {/* Quick actions */}
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <QuickAction href="/feed/" icon={Plus} label="New Post" />
          <QuickAction href="/ai-tutor/" icon={Sparkles} label="Ask AI" />
          <QuickAction href="/messages/" icon={MessageSquare} label="Messages" />
          {stats.isStudent ? (
            <QuickAction href="/student/assignments/" icon={BookOpen} label="Assignments" />
          ) : (
            <QuickAction href="/discussions/new/" icon={MessageCircle} label="Ask Question" />
          )}
        </div>
      </section>

      {/* ============ Your Institutions ============ */}
      <section>
        <SectionHeader emoji="🏛️" title="Your Institution" count={institutions.length} />
        {institutions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
            <Building2 className="mx-auto text-slate-400 mb-2" size={32} />
            <p className="text-sm text-slate-600 mb-3">
              You're not part of any institution yet.
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              <Link
                href="/dashboard/"
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
              >
                Browse Institutions
              </Link>
              <Link
                href="/institutions/new/"
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
              >
                Create One
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {institutions.map((inst) => (
              <Link
                key={inst.id}
                href={`/institutions/view/?slug=${inst.slug}`}
                className="group rounded-2xl bg-white border border-slate-200 p-5 hover:border-slate-400 hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-2xl shrink-0">
                    {inst.emoji || "🏫"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900 truncate group-hover:text-blue-600">
                      {inst.name}
                    </div>
                    <div className="text-xs text-slate-500 capitalize">
                      {inst.type || "Institution"}
                    </div>
                  </div>
                  <ArrowRight
                    size={18}
                    className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all"
                  />
                </div>
                <div className="mt-4 text-xs font-medium text-blue-600">
                  Open Hub →
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ============ Feature sections ============ */}
      {sections.map((section) => (
        <section key={section.title}>
          <SectionHeader
            emoji={section.emoji}
            title={section.title}
            count={section.items.length}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {section.items.map((item) => (
              <FeatureTile key={item.href} item={item} />
            ))}
          </div>
        </section>
      ))}

      {/* ============ Footer note ============ */}
      <div className="text-center text-xs text-slate-400 pt-4 pb-2">
        SKB Education Ecosystem · Multi-Tenant EdTech SaaS
      </div>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function SectionHeader({
  emoji,
  title,
  count,
}: {
  emoji: string;
  title: string;
  count?: number;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-lg">{emoji}</span>
      <h2 className="text-base md:text-lg font-bold text-slate-900">{title}</h2>
      {typeof count === "number" && (
        <span className="text-xs text-slate-400 font-medium">({count})</span>
      )}
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur border border-white/10 text-sm font-medium transition-colors"
    >
      <Icon size={16} />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function FeatureTile({ item }: { item: FeatureCard }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className="group rounded-2xl bg-white border border-slate-200 p-4 hover:border-slate-400 hover:shadow-md transition-all flex flex-col gap-3"
    >
      <div
        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shrink-0`}
      >
        <Icon size={18} />
      </div>
      <div>
        <div className="font-semibold text-slate-900 text-sm group-hover:text-blue-600">
          {item.label}
        </div>
        <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">
          {item.description}
        </div>
      </div>
    </Link>
  );
}
