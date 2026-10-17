"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export default function JobsPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login/");
  }, [user, authLoading, router]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.rpc("search_jobs", {
      p_query: q, p_role: role || null, p_division: null, p_limit: 30,
    });
    setJobs(data ?? []);
    setLoading(false);
  };
  useEffect(() => { if (user) load(); }, [user]);

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 border-b"
        style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/marketplace" className="text-[13px]" style={{ color: "var(--text-muted)" }}>← Marketplace</Link>
          <div className="flex gap-2">
            <Link href="/jobs/new" className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-1.5 text-fluid-caption font-semibold text-white shadow">+ Post Job</Link>
            <button onClick={signOut} className="rounded-full border px-3 py-1.5 text-fluid-caption" style={{ borderColor: "var(--border)" }}>Sign out</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pt-6">
        <div className="rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-violet-700 p-6 text-white">
          <h1 className="text-[24px] font-semibold">💼 Job Board</h1>
          <p className="text-[13px] mt-1 text-violet-50/90">শিক্ষা প্রতিষ্ঠানে নতুন সুযোগ</p>
        </div>

        <div className="mt-5 flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="🔍 Search jobs..."
            className="flex-1 rounded-full border px-4 py-2.5 text-[13px] outline-none"
            style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
          <select value={role} onChange={(e) => setRole(e.target.value)}
            className="rounded-full border px-4 py-2.5 text-[13px] outline-none"
            style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            <option value="">All roles</option>
            <option value="teacher">Teacher</option>
            <option value="tutor">Tutor</option>
            <option value="admin">Admin</option>
            <option value="accountant">Accountant</option>
            <option value="librarian">Librarian</option>
            <option value="receptionist">Receptionist</option>
          </select>
          <button onClick={load} className="rounded-full bg-emerald-500/15 px-4 py-1.5 text-fluid-caption font-semibold text-emerald-700">Search</button>
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>
        ) : jobs.length === 0 ? (
          <div className="mt-6 rounded-2xl border p-12 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            <div className="text-[48px]">💼</div>
            <div className="mt-3 text-[15px] font-semibold">No jobs yet</div>
            <div className="bangla text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>প্রথম job posting করুন</div>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {jobs.map((j) => (
              <Link key={j.id} href={"/jobs/view/?id=" + j.id}
                className="block rounded-2xl border p-4 hover:-translate-y-0.5 hover:shadow-md transition"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl text-[22px] shrink-0"
                    style={{ background: "linear-gradient(135deg,#8b5cf6,#6366f1)" }}>
                    {j.institution_logo ? <img src={j.institution_logo} alt="" className="h-full w-full object-cover rounded-xl" /> : (j.institution_emoji || "💼")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-semibold truncate">{j.title}</div>
                    <div className="text-fluid-caption truncate" style={{ color: "var(--text-muted)" }}>{j.institution_name || "Independent"}</div>
                    <div className="flex flex-wrap gap-2 mt-2 text-fluid-micro">
                      <span className="rounded-full bg-violet-500/15 px-2 py-0.5 font-medium capitalize text-violet-700">{j.role_type}</span>
                      <span className="rounded-full bg-[var(--bg-soft)] px-2 py-0.5 capitalize">{j.employment_type.replace("_", " ")}</span>
                      {j.location && <span>📍 {j.location}</span>}
                      {(j.salary_min || j.salary_max) && (
                        <span className="font-semibold text-emerald-700">
                          ৳{j.salary_min || 0}{(j.salary_max ? "-" + j.salary_max : "")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-fluid-micro text-right shrink-0" style={{ color: "var(--text-faint)" }}>
                    {j.applications_count} applied
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
