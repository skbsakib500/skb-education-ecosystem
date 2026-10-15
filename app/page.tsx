"use client";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Library, BookOpen, FileText, ChartColumn,
  Bot, Settings, GraduationCap, Users, BookMarked, ShieldCheck,
  Clock, Timer, Play, Search, Bell, ChevronDown, CircleCheck,
  TriangleAlert, Flame, Target, Award, Lock, ArrowUpRight,
  Sparkles, Terminal, Check, Copy, Ellipsis
} from "lucide-react";
import { classes, subjects, routine } from "@/lib/data";

type Role = "student" | "teacher" | "admin";

const roleMenus: Record<Role, { key: string; label: string; icon: any; locked?: boolean }[]> = {
  student: [
    { key: "home", label: "Home", icon: LayoutDashboard },
    { key: "classes", label: "Classes", icon: Library },
    { key: "subjects", label: "Subjects", icon: BookOpen },
    { key: "exams", label: "Exams", icon: FileText },
    { key: "progress", label: "Progress", icon: ChartColumn },
    { key: "ai", label: "AI Tutor", icon: Bot, locked: true },
    { key: "settings", label: "Settings", icon: Settings },
  ],
  teacher: [
    { key: "home", label: "Dashboard", icon: LayoutDashboard },
    { key: "classes", label: "My Classes", icon: GraduationCap },
    { key: "assignments", label: "Assignments", icon: FileText },
    { key: "students", label: "Students", icon: Users },
    { key: "exams", label: "Exams", icon: BookMarked },
    { key: "settings", label: "Settings", icon: Settings },
  ],
  admin: [
    { key: "home", label: "Overview", icon: LayoutDashboard },
    { key: "curriculum", label: "Curriculum", icon: BookMarked },
    { key: "users", label: "Users", icon: Users },
    { key: "moderation", label: "Moderation", icon: ShieldCheck },
    { key: "settings", label: "Settings", icon: Settings },
  ],
};

export default function Page() {
  const [role, setRole] = useState<Role>("student");
  const [cls, setCls] = useState(10);
  const [tab, setTab] = useState("home");
  const [classOpen, setClassOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState({ d: 2, h: 14, m: 22, s: 18 });

  useEffect(() => {
    const id = setInterval(() => {
      setCountdown((c) => {
        let { d, h, m, s } = c;
        if (s > 0) s--;
        else if ((s = 59, m > 0)) m--;
        else if ((m = 59, h > 0)) h--;
        else if ((h = 23, d > 0)) d--;
        return { d, h, m, s };
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const filteredSubjects = subjects.filter(
    (s) => s.name.toLowerCase().includes(query.toLowerCase()) || s.bn.includes(query)
  );

  const switchRole = (r: Role) => {
    setRole(r);
    setTab("home");
  };

  const copyConfig = () => {
    navigator.clipboard.writeText(
      `name = "skb-education-phase1"\ncompatibility_date = "2025-03-15"\n\n[vars]\nNCTB_VERSION = "2025-v1.4.2"\nPHASE = "1"\n`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const closeAll = () => { setClassOpen(false); setBellOpen(false); setProfileOpen(false); };

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-clip">
      <BackgroundOrbs />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b" style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
        <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-[15px] shadow-lg">
              SKB
            </div>
            <div className="leading-tight">
              <div className="flex items-baseline gap-2">
                <span className="text-[15px] font-semibold">SKB Education</span>
                <span className="hidden md:inline rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                  PHASE 1 • NCTB
                </span>
              </div>
              <div className="bangla text-[11px]" style={{ color: "var(--text-muted)" }}>
                জ্ঞানের ইকোসিস্টেম
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {/* Class picker */}
            <div className="relative">
              <button onClick={() => { closeAll(); setClassOpen((v) => !v); }}
                className="flex h-9 items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <span className="hidden md:inline" style={{ color: "var(--text-muted)" }}>Class</span>
                <span className="font-semibold">{cls}</span>
                <ChevronDown className={`h-3.5 w-3.5 transition ${classOpen ? "rotate-180" : ""}`} />
              </button>
              {classOpen && (
                <div className="absolute right-0 mt-2 w-40 overflow-hidden rounded-2xl border shadow-xl"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                  {classes.map((c) => (
                    <button key={c} onClick={() => { setCls(c); setClassOpen(false); }}
                      className={`flex w-full items-center justify-between px-4 py-2.5 text-[13px] ${cls === c ? "bg-emerald-500/10 font-semibold text-emerald-700" : ""}`}>
                      <span>Class {c}</span>
                      <span className="bangla text-[11px] opacity-60">শ্রেণী {c}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search */}
            <div className="hidden md:flex h-9 w-[220px] items-center gap-2 rounded-full border px-3.5"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <Search className="h-3.5 w-3.5" style={{ color: "var(--text-faint)" }} />
              <input value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search subjects..."
                className="w-full bg-transparent text-[13px] outline-none" />
            </div>

            {/* Notifications */}
            <div className="relative">
              <button onClick={() => { closeAll(); setBellOpen((v) => !v); }}
                className="relative flex h-9 w-9 items-center justify-center rounded-full border"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <Bell className="h-4 w-4" />
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2"
                  style={{ boxShadow: "0 0 0 2px var(--surface-3)" }} />
              </button>
              {bellOpen && (
                <div className="absolute right-0 mt-2 w-[320px] overflow-hidden rounded-2xl border shadow-2xl"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                  <div className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[13px] font-semibold">Notifications • নোটিফিকেশন</span>
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-700">3 new</span>
                    </div>
                    <div className="space-y-2.5">
                      {[
                        { t: "Physics assignment due tomorrow", bn: "পদার্থ অ্যাসাইনমেন্ট", time: "2h ago" },
                        { t: "You scored 92% in Chemistry MCQ", bn: "রসায়নে ৯২%", time: "5h ago" },
                        { t: "New NCTB update: Class 10 Biology", bn: "নতুন আপডেট", time: "1d ago" },
                      ].map((n, i) => (
                        <div key={i} className="rounded-xl p-3" style={{ background: "var(--bg-soft)" }}>
                          <div className="text-[13px] font-medium leading-tight">{n.t}</div>
                          <div className="bangla text-[11px]" style={{ color: "var(--text-muted)" }}>
                            {n.bn} • {n.time}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              <button onClick={() => { closeAll(); setProfileOpen((v) => !v); }}
                className="flex items-center gap-2 rounded-full border p-1 pr-3"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-[11px] font-bold text-white">
                  SA
                </div>
                <span className="hidden text-[13px] font-medium md:inline">Sakib</span>
                <ChevronDown className="hidden h-3.5 w-3.5 md:block" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border p-2 shadow-xl"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                  <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: "var(--bg-soft)" }}>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-[12px] font-bold text-white">
                      SA
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold">Sakib Al Hasan</div>
                      <div className="bangla text-[11px]" style={{ color: "var(--text-muted)" }}>
                        Class {cls} • Science
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1 p-1 text-[13px]">
                    <div className="rounded-lg px-3 py-2 hover:bg-[var(--bg-soft)]">My Profile • প্রোফাইল</div>
                    <div className="rounded-lg px-3 py-2 hover:bg-[var(--bg-soft)]">Switch Role • রোল পরিবর্তন</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto flex w-full max-w-[1600px]">
        {/* Sidebar */}
        <aside className="sticky top-16 hidden h-[calc(100vh-64px)] w-[260px] shrink-0 flex-col justify-between border-r px-3 py-6 md:flex"
          style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
          <div>
            <div className="mb-4 px-3">
              <div className="flex rounded-full p-1 text-[12px]" style={{ background: "var(--bg-soft)" }}>
                {(["student", "teacher", "admin"] as Role[]).map((r) => (
                  <button key={r} onClick={() => switchRole(r)}
                    className={`flex-1 rounded-full px-2.5 py-1.5 font-medium capitalize ${role === r ? "shadow-sm" : ""}`}
                    style={role === r ? { background: "var(--surface-3)" } : { color: "var(--text-muted)" }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
                  Menu • মেনু
                </div>
                <div className="space-y-1">
                  {roleMenus[role].map((item) => {
                    const active = tab === item.key;
                    const Icon = item.icon;
                    return (
                      <button key={item.key} onClick={() => !item.locked && setTab(item.key)}
                        className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[13.5px] ${
                          active
                            ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg"
                            : item.locked
                            ? "opacity-60"
                            : ""
                        }`}
                        style={!active ? { color: "var(--text-muted)" } : {}}>
                        <span className="flex items-center gap-3">
                          <Icon className="h-[18px] w-[18px]" />
                          <span className="font-medium">{item.label}</span>
                        </span>
                        {item.locked ? (
                          <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                            <Lock className="h-3 w-3" /> Phase 4
                          </span>
                        ) : active ? (
                          <ArrowUpRight className="h-4 w-4 opacity-70" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border p-4 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-transparent"
                style={{ borderColor: "var(--border)" }}>
                <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold">
                  <Sparkles className="h-4 w-4 text-emerald-600" /> NCTB 2025 Aligned
                </div>
                <div className="bangla text-[12px] leading-snug" style={{ color: "var(--text-muted)" }}>
                  সম্পূর্ণ নতুন কারিকুলাম অনুযায়ী সাজানো, প্রতিটি অধ্যায়ে MCQ + CQ প্রস্তুত।
                </div>
                <div className="mt-3 flex items-center gap-2 text-[11px]">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live sync active
                </div>
              </div>
            </div>
          </div>

          <div className="px-1">
            <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <div className="flex items-center gap-2 text-[12px] font-medium">
                <Terminal className="h-4 w-4" /> Deploy Ready
              </div>
              <div className="mt-2 rounded-lg bg-[#0a0f0d] p-2.5 font-mono text-[10.5px] leading-relaxed text-emerald-200 overflow-hidden">
                <div className="text-white/40"># wrangler.toml</div>
                <div>name = &quot;skb-edu&quot;</div>
                <div>date = &quot;2025-01&quot;</div>
              </div>
              <button onClick={copyConfig}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-[12px] font-medium"
                style={{ background: "var(--bg-soft)" }}>
                {copied ? (<><Check className="h-3.5 w-3.5" /> Copied</>) : (<><Copy className="h-3.5 w-3.5" /> Copy config</>)}
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 overflow-hidden px-4 py-5 md:px-8 md:py-7 pb-24 md:pb-7">
          {/* Page header */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-[22px] font-semibold tracking-tight md:text-[26px]">
                Education Ecosystem • <span className="bangla font-medium">শিক্ষা ইকোসিস্টেম</span>
              </h1>
              <p className="mt-1 text-[13px]" style={{ color: "var(--text-muted)" }}>
                Phase 1 — Student • Teacher • Admin unified dashboard for Class 8-12 NCTB
              </p>
            </div>
            <div className="flex max-w-full flex-wrap items-center gap-2 rounded-full border p-1"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              {(["student", "teacher", "admin"] as Role[]).map((r) => (
                <button key={r} onClick={() => switchRole(r)}
                  className={`rounded-full px-4 py-1.5 text-[13px] font-medium capitalize ${
                    role === r ? "shadow" : ""
                  }`}
                  style={role === r ? { background: "var(--text)", color: "var(--bg)" } : { color: "var(--text-muted)" }}>
                  {r} Dashboard
                </button>
              ))}
            </div>
          </div>

          {role === "student" && <StudentView cls={cls} countdown={countdown} query={query} setQuery={setQuery} filteredSubjects={filteredSubjects} />}
          {role === "teacher" && <TeacherView />}
          {role === "admin" && <AdminView cls={cls} />}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 flex h-[72px] items-center justify-around border-t px-2 md:hidden"
        style={{ borderColor: "var(--border)", background: "var(--surface-3)", backdropFilter: "blur(24px)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        {roleMenus[role].slice(0, 5).map((item) => {
          const active = tab === item.key;
          const Icon = item.icon;
          return (
            <button key={item.key} onClick={() => !item.locked && setTab(item.key)}
              className="flex flex-col items-center gap-1 rounded-xl px-3 py-1.5"
              style={active ? { color: "#059669" } : { color: "var(--text-muted)" }}>
              <div className={`flex h-7 w-7 items-center justify-center rounded-full ${active ? "bg-emerald-500/15" : ""}`}>
                <Icon className="h-[18px] w-[18px]" />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {(classOpen || bellOpen || profileOpen) && (
        <div className="fixed inset-0 z-10" onClick={closeAll} />
      )}
    </div>
  );
}

function BackgroundOrbs() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-[30%] -left-[10%] h-[60%] w-[50%] rounded-full bg-gradient-to-br from-emerald-200/40 to-teal-200/20 blur-[80px]" />
      <div className="absolute -bottom-[20%] -right-[10%] h-[50%] w-[45%] rounded-full bg-gradient-to-br from-teal-100/40 to-emerald-100/20 blur-[80px]" />
    </div>
  );
}

interface StudentViewProps {
  cls: number;
  countdown: { d: number; h: number; m: number; s: number };
  query: string;
  setQuery: (v: string) => void;
  filteredSubjects: Array<{
    id: string;
    name: string;
    bn: string;
    chapters: number;
    completed: number;
    color: string;
    accent: string;
  }>;
}

function StudentView({ cls, countdown, query, setQuery, filteredSubjects }: StudentViewProps) {
  const stats: Array<{
    label: string;
    bn: string;
    value: string;
    sub: string;
    icon: any;
    grad: string;
    pct: number;
    warn?: boolean;
  }> = [
    { label: "Completed Chapters", bn: "সম্পন্ন অধ্যায়", value: "24/48", sub: "50% of NCTB", icon: CircleCheck, grad: "from-emerald-500/15 to-teal-500/10", pct: 50 },
    { label: "MCQ Score", bn: "MCQ স্কোর", value: "84%", sub: "+6% this week", icon: Target, grad: "from-teal-500/15 to-cyan-500/10", pct: 84 },
    { label: "Weak Topics", bn: "দুর্বল টপিক", value: "3 Topics", sub: "Need revision", icon: TriangleAlert, grad: "from-amber-500/15 to-orange-500/10", warn: true, pct: 35 },
  ];

  return (
    <div className="space-y-7">
      {/* Hero */}
      <div className="relative w-full overflow-hidden rounded-[24px] border border-white/20 shadow-[var(--shadow-lg)]">
        <div className="relative w-full rounded-[23px] bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-6 md:p-8 text-white overflow-hidden">
          <div className="pointer-events-none absolute -right-20 -top-20 h-[220px] w-[220px] rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-[200px] w-[200px] rounded-full bg-teal-300/20 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[12px] backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-emerald-200 animate-pulse" />
                Live • NCTB 2025 • Class {cls}
              </div>
              <h2 className="mt-4 text-[28px] font-semibold leading-tight tracking-tight md:text-[34px]">
                Assalamu Alaikum, Sakib! <span className="bangla font-medium opacity-90">স্বাগতম</span>
              </h2>
              <p className="mt-2 max-w-[560px] text-[14px] leading-relaxed text-emerald-50/90">
                Class {cls} - Science • বিজ্ঞান বিভাগ • তোমার আজকের লক্ষ্য ৩টি অধ্যায় শেষ করা। তুমি ইতিমধ্যে ৭৮% এগিয়ে!
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-emerald-700 shadow">
                  <Play className="h-4 w-4" /> Continue • চালিয়ে যাও
                </button>
                <button className="rounded-full bg-white/15 px-4 py-2 text-[13px] font-medium backdrop-blur hover:bg-white/20">
                  View Routine • রুটিন দেখো
                </button>
              </div>
            </div>
            <div className="grid w-full max-w-full md:max-w-[320px] grid-cols-3 gap-3">
              {[
                { k: "Streak", v: "12 days", bn: "ধারাবাহিক", icon: Flame },
                { k: "Focus", v: "84%", bn: "মনোযোগ", icon: Target },
                { k: "Rank", v: "#23", bn: "র‍্যাংক", icon: Award },
              ].map((s) => (
                <div key={s.k} className="rounded-2xl bg-white/10 p-3 backdrop-blur border border-white/10">
                  <s.icon className="mb-2 h-4 w-4 opacity-80" />
                  <div className="text-[11px] opacity-70">{s.k}</div>
                  <div className="text-[16px] font-semibold">{s.v}</div>
                  <div className="bangla text-[10px] opacity-60">{s.bn}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-[20px] border shadow-[var(--shadow)]"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.grad} border`}
                  style={{ borderColor: "var(--border)" }}>
                  <s.icon className={`h-5 w-5 ${s.warn ? "text-amber-600" : "text-emerald-700 dark:text-emerald-300"}`} />
                </div>
                <Ellipsis className="h-4 w-4" style={{ color: "var(--text-faint)" }} />
              </div>
              <div className="mt-4">
                <div className="text-[12px] font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                  {s.label} <span className="bangla normal-case">• {s.bn}</span>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-[26px] font-semibold tracking-tight">{s.value}</span>
                  <span className={`text-[12px] ${s.warn ? "text-amber-600" : "text-emerald-600"}`}>{s.sub}</span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--bg-soft)" }}>
                  <div className={`h-full rounded-full bg-gradient-to-r ${s.warn ? "from-amber-500 to-orange-500" : "from-emerald-500 to-teal-500"}`}
                    style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Routine + Exams */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="rounded-[20px] border shadow-[var(--shadow)]" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <div className="flex items-center justify-between border-b p-5" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="text-[14px] font-semibold">Today&apos;s Routine</span>
              <span className="bangla text-[13px] font-medium" style={{ color: "var(--text-muted)" }}>• আজকের রুটিন</span>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
              {routine.filter((r) => r.done).length}/{routine.length} done
            </span>
          </div>
          <div className="p-3">
            {routine.map((r, i) => (
              <div key={i} className="flex gap-3 rounded-xl p-3 hover:bg-[var(--bg-soft)]">
                <div className="flex flex-col items-center">
                  <div className={`h-2.5 w-2.5 rounded-full ${r.done ? "bg-emerald-500" : "bg-[var(--border-strong)] ring-2 ring-emerald-500/20"}`} />
                  {i !== routine.length - 1 && <div className="mt-1 h-12 w-px" style={{ background: "var(--border)" }} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>{r.time}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${r.done ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700"}`}>
                      {r.type}
                    </span>
                  </div>
                  <div className="mt-1 truncate text-[13.5px] font-medium">
                    {r.subject} <span className="bangla text-[12px]" style={{ color: "var(--text-muted)" }}>• {r.bn}</span>
                  </div>
                </div>
                <CircleCheck className={`h-4 w-4 shrink-0 ${r.done ? "text-emerald-500" : ""}`} style={!r.done ? { color: "var(--text-faint)" } : {}} />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[20px] border p-5 shadow-[var(--shadow)]" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4" />
                <span className="text-[14px] font-semibold">Upcoming Exams</span>
                <span className="bangla text-[13px]" style={{ color: "var(--text-muted)" }}>• আসন্ন</span>
              </div>
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Physics</span>
            </div>
            <div className="mt-4 rounded-2xl bg-gradient-to-br from-[#0f2218] to-[#123524] p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[13px] opacity-80">NCTB Model Test - Chapter 7-9</div>
                  <div className="bangla text-[11px] opacity-60">মডেল টেস্ট • অধ্যায় ৭-৯</div>
                </div>
                <div className="rounded-full bg-white/10 px-2.5 py-1 text-[11px]">Class {cls}</div>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                {[
                  { v: countdown.d, l: "Days" }, { v: countdown.h, l: "Hours" },
                  { v: countdown.m, l: "Mins" }, { v: countdown.s, l: "Secs" },
                ].map((t) => (
                  <div key={t.l} className="rounded-xl bg-white/10 py-2.5 backdrop-blur">
                    <div className="text-[20px] font-semibold">{String(t.v).padStart(2, "0")}</div>
                    <div className="text-[10px] uppercase tracking-wide opacity-70">{t.l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button className="flex-1 rounded-full py-2 text-[13px] font-medium" style={{ background: "var(--text)", color: "var(--bg)" }}>
                Start Preparation
              </button>
              <button className="rounded-full border px-4 py-2 text-[13px]" style={{ borderColor: "var(--border)" }}>
                Syllabus
              </button>
            </div>
          </div>

          <div className="flex h-11 items-center gap-2 rounded-full border px-4 md:hidden"
            style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            <Search className="h-4 w-4" style={{ color: "var(--text-faint)" }} />
            <input value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search subjects • বিষয় খুঁজুন"
              className="w-full bg-transparent text-[13px] outline-none" />
          </div>
        </div>
      </div>

      {/* Subjects */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-[15px] font-semibold">
            <BookOpen className="h-4 w-4" /> Subjects • <span className="bangla">বিষয়সমূহ</span>
            <span className="ml-2 rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{ background: "var(--bg-soft)", color: "var(--text-muted)" }}>
              {filteredSubjects.length} total
            </span>
          </h3>
          <button className="text-[12px] font-medium text-emerald-700 dark:text-emerald-300">
            View all • সব দেখো
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {filteredSubjects.map((s) => (
            <div key={s.id} className="relative overflow-hidden rounded-[20px] border shadow-[var(--shadow)] transition hover:-translate-y-0.5"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${s.color}`} />
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} text-white shadow font-bold`}>
                    {s.name[0]}
                  </div>
                  <span className="rounded-full px-2 py-1 text-[10px] font-medium" style={{ background: "var(--bg-soft)" }}>
                    {s.completed}/{s.chapters} done
                  </span>
                </div>
                <div className="mt-4">
                  <div className="text-[14px] font-semibold">{s.name}</div>
                  <div className="bangla text-[12px]" style={{ color: "var(--text-muted)" }}>{s.bn} • NCTB</div>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--bg-soft)" }}>
                    <div className="h-full rounded-full" style={{ width: `${(s.completed / s.chapters) * 100}%`, background: s.accent }} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px]">
                    <span style={{ color: "var(--text-muted)" }}>{s.chapters} chapters</span>
                    <span className="flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-300">
                      <Play className="h-3 w-3" /> Study
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TeacherView() {
  const cards = [
    { label: "My Classes", bn: "আমার ক্লাস", value: "3", sub: "Class 8,10,11", icon: GraduationCap },
    { label: "Students", bn: "শিক্ষার্থী", value: "87", sub: "Active this week 72", icon: Users },
    { label: "Pending Assignments", bn: "বাকি অ্যাসাইনমেন্ট", value: "12", sub: "Need review", icon: FileText, warn: true },
  ];
  const assignments = [
    { title: "Physics - Motion MCQ", cls: "Class 10", due: "Today", status: "Reviewing", count: 24 },
    { title: "Chemistry - Acid & Base", cls: "Class 10", due: "Tomorrow", status: "Pending", count: 18 },
    { title: "Biology - Cell Structure", cls: "Class 9", due: "2 days", status: "Published", count: 31 },
  ];
  const students = [
    { name: "Sakib H.", score: 92 }, { name: "Nusrat J.", score: 84 },
    { name: "Rafiq A.", score: 71 }, { name: "Mim Akter", score: 68 },
  ];

  return (
    <div className="space-y-7">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-[20px] border p-5 shadow-[var(--shadow)]"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            <div className="flex items-center justify-between">
              <c.icon className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
              <span className={`h-2 w-2 rounded-full ${c.warn ? "bg-amber-500" : "bg-emerald-500"}`} />
            </div>
            <div className="mt-3 text-[12px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              {c.label} • <span className="bangla normal-case">{c.bn}</span>
            </div>
            <div className="mt-1 text-[28px] font-semibold">{c.value}</div>
            <div className="text-[12px]" style={{ color: "var(--text-muted)" }}>{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-[20px] border shadow-[var(--shadow)]" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <div className="flex items-center justify-between border-b p-5" style={{ borderColor: "var(--border)" }}>
            <span className="text-[14px] font-semibold">Assignment List • অ্যাসাইনমেন্ট তালিকা</span>
            <button className="rounded-full px-3 py-1 text-[12px]" style={{ background: "var(--text)", color: "var(--bg)" }}>
              + New
            </button>
          </div>
          <div>
            {assignments.map((a, i) => (
              <div key={i} className="flex items-center justify-between p-4 hover:bg-[var(--bg-soft)]">
                <div className="min-w-0">
                  <div className="text-[13px] font-medium">{a.title}</div>
                  <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {a.cls} • {a.count} submissions • Due {a.due}
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  a.status === "Pending" ? "bg-amber-500/10 text-amber-700" :
                  a.status === "Reviewing" ? "bg-teal-500/10 text-teal-700" : "bg-emerald-500/10 text-emerald-700"
                }`}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[20px] border p-5 shadow-[var(--shadow)]" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <div className="mb-4 text-[14px] font-semibold">Student Progress • শিক্ষার্থী অগ্রগতি</div>
          <div className="space-y-3">
            {students.map((s) => (
              <div key={s.name} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-semibold" style={{ background: "var(--bg-soft)" }}>
                  {s.name[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{s.score}%</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full" style={{ background: "var(--bg-soft)" }}>
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${s.score}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminView({ cls }: { cls: number }) {
  return (
    <div className="space-y-7">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-[20px] border p-5 shadow-[var(--shadow)]" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <div className="text-[12px]" style={{ color: "var(--text-muted)" }}>Total Users • মোট ব্যবহারকারী</div>
          <div className="mt-1 text-[28px] font-semibold">12,483</div>
          <div className="mt-2 flex gap-2 text-[11px]">
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-700">Students 11.2k</span>
            <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-teal-700">Teachers 1.1k</span>
          </div>
        </div>
        <div className="rounded-[20px] border p-5 shadow-[var(--shadow)]" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <div className="text-[12px]" style={{ color: "var(--text-muted)" }}>Curriculum Version • কারিকুলাম</div>
          <div className="mt-1 text-[20px] font-semibold">NCTB 2025 v1.4.2</div>
          <div className="mt-2 text-[11px]" style={{ color: "var(--text-muted)" }}>Last updated 3 days ago • 48 chapters synced</div>
        </div>
        <div className="rounded-[20px] border p-5 shadow-[var(--shadow)]" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <div className="text-[12px]" style={{ color: "var(--text-muted)" }}>Moderation Queue • মডারেশন</div>
          <div className="mt-1 text-[28px] font-semibold">7 pending</div>
          <div className="mt-2 text-[11px] text-amber-600">2 flagged contents need review</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-[20px] border shadow-[var(--shadow)]" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <div className="border-b p-5 text-[14px] font-semibold" style={{ borderColor: "var(--border)" }}>
            Curriculum Version Manager • কারিকুলাম ম্যানেজার
          </div>
          <div className="p-3">
            {[
              { ver: "v1.4.2", date: "2025-03-10", note: "Physics Chapter 8-9 revised", active: true },
              { ver: "v1.4.1", date: "2025-02-28", note: "Biology diagram updates", active: false },
              { ver: "v1.4.0", date: "2025-02-15", note: "NCTB 2025 base alignment", active: false },
            ].map((v) => (
              <div key={v.ver} className={`flex items-center justify-between rounded-xl p-3 ${v.active ? "bg-emerald-500/10 border border-emerald-500/20" : "hover:bg-[var(--bg-soft)]"}`}>
                <div>
                  <div className="text-[13px] font-semibold">
                    {v.ver} {v.active && <span className="ml-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] text-white">ACTIVE</span>}
                  </div>
                  <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>{v.date} • {v.note}</div>
                </div>
                <button className="text-[11px] font-medium text-emerald-700">{v.active ? "Manage" : "Rollback"}</button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[20px] border p-5 shadow-[var(--shadow)]" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <div className="text-[14px] font-semibold">Moderation Queue • মডারেশন কিউ</div>
          <div className="mt-4 space-y-2">
            {[
              { type: "MCQ flagged", by: "Student • Class 10", time: "1h ago" },
              { type: "Assignment spam", by: "Class 8 • Math", time: "3h ago" },
              { type: "New teacher request", by: "Rahman Sir", time: "5h ago" },
            ].map((m, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl p-3" style={{ background: "var(--bg-soft)" }}>
                <div>
                  <div className="text-[13px] font-medium">{m.type}</div>
                  <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>{m.by} • {m.time}</div>
                </div>
                <button className="rounded-full border px-3 py-1 text-[11px]" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                  Review
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Deploy + Checklist */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-[20px] border bg-[#0a1210] p-5 text-emerald-100 shadow-[var(--shadow)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[13px] font-medium text-white">
              <Terminal className="h-4 w-4 text-emerald-400" /> GitHub Pages Deploy
            </div>
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-[10px] text-emerald-300">main branch</span>
          </div>
          <div className="mt-4 rounded-xl bg-black/40 overflow-hidden">
            <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-emerald-200/90">{`# SKB Education Phase 1
name = "skb-education-ecosystem"
main = "app/page.tsx"
date = "2025-10"

[vars]
NCTB_VERSION = "2025-v1.4.2"
DEFAULT_CLASS = "${cls}"
PHASE = "1"

[build]
command = "pnpm build"
output = "out"
`}</pre>
          </div>
        </div>

        <div className="rounded-[20px] border p-5 shadow-[var(--shadow)]" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <div className="text-[13px] font-semibold">Phase 1 Checklist • ফেজ ১</div>
          <div className="mt-3 space-y-2.5">
            {[
              { t: "NCTB Class 8-12 mapping", done: true },
              { t: "Role-based dashboards", done: true },
              { t: "Glassmorphism + Emerald theme", done: true },
              { t: "AI Tutor (Phase 4) locked UI", done: true },
              { t: "GitHub Pages auto-deploy", done: true },
            ].map((c) => (
              <div key={c.t} className="flex items-center gap-2 text-[13px]">
                <div className="flex h-5 w-5 items-center justify-center rounded-full"
                  style={c.done ? { background: "#10b981", color: "white" } : { border: "1px solid var(--border)" }}>
                  {c.done && <Check className="h-3 w-3" />}
                </div>
                <span style={!c.done ? { color: "var(--text-muted)" } : {}}>{c.t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
