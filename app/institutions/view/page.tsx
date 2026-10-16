"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { getInstitutionMeta } from "@/lib/institution-types";
import { getBoardMeta } from "@/lib/education-boards";
import { getDivisionMeta, getDistrictMeta } from "@/lib/bangladesh-data";
import TeachersTab from "@/components/institution/TeachersTab";
import ExamsTab from "@/components/institution/ExamsTab";
import AttendanceTab from "@/components/institution/AttendanceTab";
import NoticesTab from "@/components/institution/NoticesTab";
import StudentsTabV2 from "@/components/institution/StudentsTabV2";
import AcademicConfigurator from "@/components/institution/AcademicConfigurator";
import FinanceTab from "@/components/institution/FinanceTab";
import AnalyticsTab from "@/components/institution/AnalyticsTab";
import SubjectsTab from "@/components/institution/SubjectsTab";
import TimetableTab from "@/components/institution/TimetableTab";
import ReportCard from "@/components/institution/ReportCard";
import CommunicationTab from "@/components/institution/CommunicationTab";
import QuickSearch from "@/components/institution/QuickSearch";
import HolidaysTab from "@/components/institution/HolidaysTab";
import PromotionTab from "@/components/institution/PromotionTab";
import JoinRequestsTab from "@/components/institution/JoinRequestsTab";
import LibraryTab from "@/components/institution/LibraryTab";
import EventsTab from "@/components/institution/EventsTab";
import CertificatesTab from "@/components/institution/CertificatesTab";
import AssignmentsTab from "@/components/institution/AssignmentsTab";
import LeaveTab from "@/components/institution/LeaveTab";
import BulkImportModal from "@/components/institution/BulkImportModal";
import NotificationCenter from "@/components/NotificationCenter";

export default function Page() {
  return <Suspense fallback={<Loading />}><InstitutionView /></Suspense>;
}

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
    </div>
  );
}

type Tab = "overview" | "analytics" | "classes" | "students" | "teachers" | "subjects" | "timetable" | "exams" | "attendance" | "finance" | "notices" | "communication" | "holidays" | "promotion" | "requests" | "settings";

function InstitutionView() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");

  const [inst, setInst] = useState<any>(null);
  const [membership, setMembership] = useState<any>(null);
  const [stats, setStats] = useState({ classes: 0, students: 0, teachers: 0, exams: 0 });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [reportStudent, setReportStudent] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !slug) return;
    (async () => {
      const { data: instData } = await supabase.from("institutions").select("*").eq("slug", slug).maybeSingle();
      if (!instData) { router.push("/dashboard/"); return; }
      const { data: memData } = await supabase.from("memberships").select("*")
        .eq("institution_id", instData.id).eq("user_id", user.id).maybeSingle();
      setInst(instData);
      setMembership(memData);
      await refreshStats(instData.id);
      setLoading(false);
    })();
  }, [user, slug, router]);

  const refreshStats = async (institutionId: string) => {
    const [c, s, t, e] = await Promise.all([
      supabase.from("classes").select("id", { count: "exact", head: true }).eq("institution_id", institutionId),
      supabase.from("students").select("id", { count: "exact", head: true }).eq("institution_id", institutionId),
      supabase.from("memberships").select("id", { count: "exact", head: true }).eq("institution_id", institutionId).eq("role", "teacher"),
      supabase.from("exams").select("id", { count: "exact", head: true }).eq("institution_id", institutionId),
    ]);
    setStats({ classes: c.count ?? 0, students: s.count ?? 0, teachers: t.count ?? 0, exams: e.count ?? 0 });
  };

  if (authLoading || loading || !inst) return <Loading />;

  const isAdmin = membership?.role === "admin";
  const typeMeta = getInstitutionMeta(inst.type);
  const boardMeta = getBoardMeta(inst.education_board);
  const divisionMeta = getDivisionMeta(inst.division);
  const districtMeta = getDistrictMeta(inst.division, inst.district ?? "");

  const tabs: { key: Tab; label: string; bn: string; emoji: string }[] = [
    { key: "overview",   label: "Overview",   bn: "সারসংক্ষেপ",   emoji: "📊" },
    { key: "analytics",  label: "Analytics",  bn: "বিশ্লেষণ",     emoji: "📈" },
    { key: "classes",    label: "Classes",    bn: "শ্রেণি",        emoji: "📚" },
    { key: "subjects",   label: "Subjects",   bn: "বিষয়",         emoji: "📖" },
    { key: "timetable",  label: "Timetable",  bn: "সময়সূচি",      emoji: "🕐" },
    { key: "students",   label: "Students",   bn: "শিক্ষার্থী",   emoji: "👥" },
    { key: "teachers",   label: "Teachers",   bn: "শিক্ষক",       emoji: "👨‍🏫" },
    { key: "exams",      label: "Exams",      bn: "পরীক্ষা",      emoji: "📝" },
    { key: "attendance", label: "Attendance", bn: "উপস্থিতি",     emoji: "✅" },
    { key: "finance",    label: "Finance",    bn: "হিসাব",        emoji: "💵" },
    { key: "notices",    label: "Notices",    bn: "নোটিশ",        emoji: "📢" },
    { key: "communication", label: "Messages", bn: "বার্তা",  emoji: "✉️" },
    { key: "holidays",   label: "Holidays",   bn: "ছুটি",         emoji: "🎉" },
    { key: "promotion",  label: "Promotion",  bn: "প্রমোশন",      emoji: "🔄" },
    { key: "requests",   label: "Requests",   bn: "অনুরোধ",       emoji: "📥" },
    { key: "settings",   label: "Settings",   bn: "সেটিংস",       emoji: "⚙️" },
  ];

  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 border-b"
        style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
          <Link href="/dashboard" className="flex items-center gap-2 text-[13px]" style={{ color: "var(--text-muted)" }}>← Dashboard</Link>
          <div className="flex items-center gap-2">
            {isAdmin && <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-700">ADMIN</span>}
            <span className="text-[11px] capitalize hidden sm:inline" style={{ color: "var(--text-muted)" }}>{membership?.role ?? "member"}</span>
            <QuickSearch institutionId={inst.id} />
            <NotificationCenter />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 md:px-8 pt-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-6 md:p-8 text-white">
          <div className="pointer-events-none absolute -right-20 -top-20 h-[220px] w-[220px] rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex flex-col md:flex-row md:items-center gap-5">
            <div className="flex h-20 w-20 md:h-24 md:w-24 items-center justify-center rounded-3xl border-4 text-[36px] overflow-hidden shrink-0"
              style={{ borderColor: "rgba(255,255,255,0.3)", background: "white" }}>
              {inst.logo_url ? <img src={inst.logo_url} alt="" className="h-full w-full object-cover" /> : (inst.emoji || typeMeta.emoji)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-emerald-200 animate-pulse" />
                {typeMeta.emoji} {typeMeta.label} · {typeMeta.bn}
              </div>
              <h1 className="mt-3 text-[24px] md:text-[30px] font-semibold leading-tight truncate">{inst.name}</h1>
              {inst.motto && <div className="text-[13px] italic opacity-90 mt-1">"{inst.motto}"</div>}
              <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                {districtMeta && (
                  <span className="rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">
                    📍 {districtMeta.label}, {divisionMeta?.label}
                  </span>
                )}
                <span className="rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">
                  {boardMeta.emoji} {boardMeta.label}
                </span>
                {inst.established_year && (
                  <span className="rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">Est. {inst.established_year}</span>
                )}
                {isAdmin && (
                  <Link href={"/institutions/edit/?slug=" + inst.slug}
                    className="rounded-full bg-white/20 px-2.5 py-1 backdrop-blur hover:bg-white/30 font-semibold">
                    ✏️ Edit
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 md:px-8 mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniStat icon="📚" value={stats.classes} label="Classes" bn="শ্রেণি" />
          <MiniStat icon="👥" value={stats.students} label="Students" bn="শিক্ষার্থী" />
          <MiniStat icon="👨‍🏫" value={stats.teachers} label="Teachers" bn="শিক্ষক" />
          <MiniStat icon="📝" value={stats.exams} label="Exams" bn="পরীক্ষা" />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 md:px-8 mt-6">
        <div className="flex gap-1 overflow-x-auto rounded-2xl border p-1"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={'flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-medium whitespace-nowrap transition ' +
                (tab === t.key ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow" : "")}
              style={tab !== t.key ? { color: "var(--text-muted)" } : {}}>
              <span>{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 md:px-8 mt-6">
        {tab === "overview" && <OverviewTab inst={inst} stats={stats} isAdmin={isAdmin} />}
        {tab === "analytics" && <AnalyticsTab institutionId={inst.id} />}
        {tab === "classes" && <ClassesTab institutionId={inst.id} isAdmin={isAdmin} onChange={() => refreshStats(inst.id)} />}
        {tab === "students" && <StudentsTabV2 institutionId={inst.id} isAdmin={isAdmin} onChange={() => refreshStats(inst.id)} />}
        {tab === "teachers" && <TeachersTab institutionId={inst.id} isAdmin={isAdmin} />}
        {tab === "subjects" && <SubjectsTab institutionId={inst.id} isAdmin={isAdmin} />}
        {tab === "timetable" && <TimetableTab institutionId={inst.id} isAdmin={isAdmin} />}
        {tab === "exams" && <ExamsTab institutionId={inst.id} isAdmin={isAdmin} />}
        {tab === "attendance" && <AttendanceTab institutionId={inst.id} isAdmin={isAdmin} />}
        {tab === "finance" && <FinanceTab institutionId={inst.id} isAdmin={isAdmin} />}
        {tab === "notices" && <NoticesTab institutionId={inst.id} isAdmin={isAdmin} />}
        {tab === "communication" && <CommunicationTab institutionId={inst.id} isAdmin={isAdmin} />}
        {tab === "holidays" && <HolidaysTab institutionId={inst.id} isAdmin={isAdmin} />}
        {tab === "promotion" && <PromotionTab institutionId={inst.id} isAdmin={isAdmin} />}
        {tab === "requests" && <JoinRequestsTab institutionId={inst.id} isAdmin={isAdmin} />}
        {tab === "settings" && (
          <div className="rounded-2xl border p-6" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            <AcademicConfigurator
              institutionId={inst.id}
              initialStream={(inst.academic_stream as any) ?? "general"}
              initialLevels={Array.isArray(inst.levels) ? inst.levels : []}
              isAdmin={isAdmin}
              onSave={() => refreshStats(inst.id)}
            />
          </div>
        )}
      </div>

      {reportStudent && (
        <ReportCard
          institutionId={inst.id}
          studentId={reportStudent}
          onClose={() => setReportStudent(null)}
        />
      )}
    </div>
  );
}

function MiniStat({ icon, value, label, bn }: { icon: string; value: number; label: string; bn: string }) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
      <div className="text-[20px]">{icon}</div>
      <div className="mt-2 text-[24px] font-semibold leading-none">{value}</div>
      <div className="mt-1 text-[11px] font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{label}</div>
      <div className="bangla text-[10px]" style={{ color: "var(--text-faint)" }}>{bn}</div>
    </div>
  );
}

function OverviewTab({ inst, stats, isAdmin }: { inst: any; stats: any; isAdmin: boolean }) {
  const typeMeta = getInstitutionMeta(inst.type);
  const boardMeta = getBoardMeta(inst.education_board);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card title="Institution Details" bn="প্রতিষ্ঠানের তথ্য">
        <Row label="Type" value={typeMeta.emoji + " " + typeMeta.label} />
        <Row label="Board" value={boardMeta.emoji + " " + boardMeta.label} />
        <Row label="Division" value={inst.division ?? "—"} />
        <Row label="City" value={inst.city ?? "—"} />
        <Row label="Established" value={String(inst.established_year ?? "—")} />
        <Row label="Slug" value={"skb.edu.bd/" + inst.slug} mono />
      </Card>
      <Card title="Contact" bn="যোগাযোগ">
        <Row label="Owner" value={inst.owner_email} />
        <Row label="Phone" value={inst.contact_phone ?? "—"} />
        <Row label="Email" value={inst.contact_email ?? "—"} />
        {inst.description && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
            <div className="text-[11px] font-medium mb-1" style={{ color: "var(--text-muted)" }}>Description</div>
            <div className="text-[12px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{inst.description}</div>
          </div>
        )}
      </Card>
      <Card title="Quick Stats" bn="দ্রুত হিসাব">
        <Row label="Classes" value={String(stats.classes)} />
        <Row label="Students" value={String(stats.students)} />
        <Row label="Teachers" value={String(stats.teachers)} />
        <Row label="Exams" value={String(stats.exams)} />
      </Card>
      <Card title="Platform Status" bn="প্ল্যাটফর্ম">
        <Row label="Phase" value="Phase 3 — Full Management" />
        <Row label="Storage" value="Supabase · institution-logos" />
        <Row label="Security" value="Row-Level Security · Active" />
      </Card>
    </div>
  );
}

function ClassesTab({ institutionId, isAdmin, onChange }: { institutionId: string; isAdmin: boolean; onChange: () => void }) {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [section, setSection] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("classes").select("*").eq("institution_id", institutionId).order("name");
    setClasses(data ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, [institutionId]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true); setErr("");
    const { error } = await supabase.from("classes").insert({
      institution_id: institutionId, name: name.trim(), section: section.trim() || null,
    });
    if (error) { setErr(error.message); setSaving(false); return; }
    setName(""); setSection(""); setShowForm(false); setSaving(false);
    await load(); onChange();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this class?")) return;
    const { error } = await supabase.from("classes").delete().eq("id", id);
    if (!error) { await load(); onChange(); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[16px] font-semibold">Classes · <span className="bangla font-normal">শ্রেণি</span></h2>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)}
            className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow">
            {showForm ? "Cancel" : "+ Add Class"}
          </button>
        )}
      </div>
      {showForm && isAdmin && (
        <form onSubmit={add} className="mb-4 rounded-2xl border p-4 space-y-3"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Class Name *</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Class 10 / HSC-1"
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Section</label>
              <input type="text" value={section} onChange={(e) => setSection(e.target.value)}
                placeholder="A / B / Science"
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>
          </div>
          {err && <div className="text-[12px] text-rose-600">{err}</div>}
          <button type="submit" disabled={saving}
            className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-2 text-[13px] font-semibold text-white disabled:opacity-50">
            {saving ? "Saving..." : "Save Class"}
          </button>
        </form>
      )}
      {loading ? (
        <div className="text-[13px] text-center py-10" style={{ color: "var(--text-muted)" }}>Loading...</div>
      ) : classes.length === 0 ? (
        <EmptyBox icon="📚" title="No classes yet" bn="কোনো শ্রেণি নেই" note={isAdmin ? "+ Add Class দিয়ে শুরু করুন" : "Admin এখনো class যোগ করেননি"} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {classes.map((c) => (
            <div key={c.id} className="group rounded-2xl border p-4 flex items-center justify-between"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <div className="min-w-0">
                <div className="text-[14px] font-semibold truncate">{c.name}</div>
                {c.section && <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>Section {c.section}</div>}
              </div>
              {isAdmin && (
                <button onClick={() => remove(c.id)}
                  className="opacity-0 group-hover:opacity-100 transition rounded-full px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-500/10">
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StudentsTab({ institutionId, isAdmin, onChange }: { institutionId: string; isAdmin: boolean; onChange: () => void }) {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ full_name: "", roll_number: "", class_id: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    const [sRes, cRes] = await Promise.all([
      supabase.from("students").select("*").eq("institution_id", institutionId).order("created_at", { ascending: false }),
      supabase.from("classes").select("*").eq("institution_id", institutionId).order("name"),
    ]);
    setStudents(sRes.data ?? []); setClasses(cRes.data ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, [institutionId]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) return;
    setSaving(true); setErr("");
    const { error } = await supabase.from("students").insert({
      institution_id: institutionId,
      full_name: form.full_name.trim(),
      roll_number: form.roll_number.trim() || null,
      class_id: form.class_id || null,
    });
    if (error) { setErr(error.message); setSaving(false); return; }
    setForm({ full_name: "", roll_number: "", class_id: "" });
    setShowForm(false); setSaving(false);
    await load(); onChange();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this student?")) return;
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (!error) { await load(); onChange(); }
  };

  const className = (id: string) => classes.find((c) => c.id === id)?.name ?? "—";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[16px] font-semibold">Students · <span className="bangla font-normal">শিক্ষার্থী</span></h2>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)}
            className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow">
            {showForm ? "Cancel" : "+ Add Student"}
          </button>
        )}
      </div>
      {showForm && isAdmin && (
        <form onSubmit={add} className="mb-4 rounded-2xl border p-4 space-y-3"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Full Name *</label>
              <input type="text" required value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Sakib Al Hasan"
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Roll No</label>
              <input type="text" value={form.roll_number}
                onChange={(e) => setForm({ ...form, roll_number: e.target.value })}
                placeholder="01"
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>
          </div>
          <div>
            <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Class</label>
            <select value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })}
              className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <option value="">— Select class —</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}{c.section ? " · " + c.section : ""}</option>)}
            </select>
          </div>
          {err && <div className="text-[12px] text-rose-600">{err}</div>}
          <button type="submit" disabled={saving}
            className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-2 text-[13px] font-semibold text-white disabled:opacity-50">
            {saving ? "Saving..." : "Save Student"}
          </button>
        </form>
      )}
      {loading ? (
        <div className="text-[13px] text-center py-10" style={{ color: "var(--text-muted)" }}>Loading...</div>
      ) : students.length === 0 ? (
        <EmptyBox icon="👥" title="No students yet" bn="কোনো শিক্ষার্থী নেই" note={isAdmin ? "+ Add Student দিয়ে শুরু করুন" : "Admin এখনো student যোগ করেননি"} />
      ) : (
        <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ background: "var(--bg-soft)" }}>
                <th className="text-left p-3 text-[11px] font-medium uppercase" style={{ color: "var(--text-muted)" }}>Name</th>
                <th className="text-left p-3 text-[11px] font-medium uppercase" style={{ color: "var(--text-muted)" }}>Roll</th>
                <th className="text-left p-3 text-[11px] font-medium uppercase hidden sm:table-cell" style={{ color: "var(--text-muted)" }}>Class</th>
                {isAdmin && <th className="p-3 w-20"></th>}
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="p-3 font-medium">{s.full_name}</td>
                  <td className="p-3" style={{ color: "var(--text-muted)" }}>{s.roll_number ?? "—"}</td>
                  <td className="p-3 hidden sm:table-cell" style={{ color: "var(--text-muted)" }}>{s.class_id ? className(s.class_id) : "—"}</td>
                  {isAdmin && (
                    <td className="p-3 text-right">
                      <button onClick={() => remove(s.id)}
                        className="rounded-full px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-500/10">
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PlaceholderTab({ label, bn, note }: { label: string; bn: string; note: string }) {
  return (
    <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
      <div className="text-[36px]">🚧</div>
      <div className="mt-3 text-[16px] font-semibold">{label} · <span className="bangla font-normal">{bn}</span></div>
      <div className="mt-1 text-[12px]" style={{ color: "var(--text-muted)" }}>{note}</div>
    </div>
  );
}

function Card({ title, bn, children }: { title: string; bn: string; children: any }) {
  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
      <div className="text-[14px] font-semibold mb-3">
        {title} <span className="bangla font-normal text-[12px]" style={{ color: "var(--text-muted)" }}>· {bn}</span>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b last:border-b-0" style={{ borderColor: "var(--border)" }}>
      <div className="text-[12px]" style={{ color: "var(--text-muted)" }}>{label}</div>
      <div className={'text-[12px] text-right ' + (mono ? "font-mono" : "")}>{value}</div>
    </div>
  );
}

function EmptyBox({ icon, title, bn, note }: { icon: string; title: string; bn: string; note: string }) {
  return (
    <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
      <div className="text-[36px]">{icon}</div>
      <div className="mt-3 text-[15px] font-semibold">{title}</div>
      <div className="bangla text-[12px]" style={{ color: "var(--text-muted)" }}>{bn}</div>
      <div className="mt-2 text-[12px]" style={{ color: "var(--text-faint)" }}>{note}</div>
    </div>
  );
}
