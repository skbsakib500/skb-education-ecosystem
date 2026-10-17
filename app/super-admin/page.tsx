"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export default function SuperAdmin() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview"|"institutions"|"plans">("overview");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Check platform admin
      const { data: adm } = await supabase.from("platform_admins").select("user_id, role")
        .eq("user_id", user.id).maybeSingle();
      if (!adm) { setIsAdmin(false); setLoading(false); return; }
      setIsAdmin(true);

      const [statsRes, instRes] = await Promise.all([
        supabase.rpc("platform_stats"),
        supabase.from("institutions").select(`
          id, name, slug, type, status, division, city, created_at, suspended_at, suspended_reason,
          subscriptions:subscriptions(plan_id, status, subscription_plans:plan_id(code, name, name_bn, price_bdt))
        `).order("created_at", { ascending: false }),
      ]);
      setStats(statsRes.data);
      setInstitutions(instRes.data ?? []);
      setLoading(false);
    })();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md rounded-2xl border p-8"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="text-[48px]">🔒</div>
          <div className="mt-3 text-[16px] font-semibold">Platform Admin Access Only</div>
          <div className="bangla text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>
            এই page শুধু SKB প্ল্যাটফর্ম মালিকের জন্য
          </div>
          <Link href="/dashboard" className="mt-5 inline-block rounded-full border px-5 py-2 text-[13px]"
            style={{ borderColor: "var(--border)" }}>
            Go to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const filtered = institutions.filter((i) => {
    const matchSearch = !search ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.slug.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" ||
      (filterStatus === "active" && !i.suspended_at) ||
      (filterStatus === "suspended" && i.suspended_at);
    return matchSearch && matchStatus;
  });

  const suspend = async (id: string) => {
    const reason = prompt("Suspend reason:");
    if (!reason) return;
    const { error } = await supabase.rpc("suspend_institution", { p_institution_id: id, p_reason: reason });
    if (error) { alert(error.message); return; }
    window.location.reload();
  };

  const reactivate = async (id: string) => {
    if (!confirm("Reactivate this institution?")) return;
    const { error } = await supabase.rpc("reactivate_institution", { p_institution_id: id });
    if (error) { alert(error.message); return; }
    window.location.reload();
  };

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 border-b"
        style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-bold text-[13px] shadow-lg">
              👑
            </div>
            <div className="leading-tight">
              <div className="text-[14px] font-semibold">SKB Super Admin</div>
              <div className="bangla text-fluid-micro" style={{ color: "var(--text-muted)" }}>প্ল্যাটফর্ম কনসোল</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="rounded-full border px-3.5 py-1.5 text-fluid-caption"
              style={{ borderColor: "var(--border)" }}>Institution View</Link>
            <button onClick={signOut} className="rounded-full border px-3.5 py-1.5 text-fluid-caption"
              style={{ borderColor: "var(--border)" }}>Sign out</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 md:px-8 pt-8">
        <div className="rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-violet-700 p-6 md:p-8 text-white relative overflow-hidden">
          <div className="pointer-events-none absolute -right-20 -top-20 h-[220px] w-[220px] rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-fluid-caption backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-violet-200 animate-pulse" />
              Owner Console
            </div>
            <h1 className="mt-4 text-[26px] md:text-[32px] font-semibold">SKB Education Ecosystem — Platform Control</h1>
            <p className="mt-2 text-[14px] text-violet-50/90 max-w-3xl">
              সব প্রতিষ্ঠান, subscription, billing, user — সব এখান থেকে নিয়ন্ত্রণ করুন।
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 rounded-full border p-1 overflow-x-auto"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          {[
            { k: "overview", l: "Overview", e: "📊" },
            { k: "institutions", l: "Institutions", e: "🏛️" },
            { k: "plans", l: "Plans", e: "💳" },
          ].map((t) => (
            <button key={t.k} onClick={() => setTab(t.k as any)}
              className={"rounded-full px-4 py-1.5 text-[13px] font-medium whitespace-nowrap " + (tab === t.k ? "bg-[var(--text)] text-[var(--bg)]" : "")}
              style={tab !== t.k ? { color: "var(--text-muted)" } : {}}>
              {t.e} {t.l}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "overview" && <Overview stats={stats} />}
          {tab === "institutions" && (
            <InstitutionsTable
              institutions={filtered}
              totalCount={institutions.length}
              search={search}
              setSearch={setSearch}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              onSuspend={suspend}
              onReactivate={reactivate}
            />
          )}
          {tab === "plans" && <PlansView />}
        </div>
      </div>
    </main>
  );
}

function Overview({ stats }: { stats: any }) {
  if (!stats) return <div className="text-center py-10 text-[13px]" style={{ color: "var(--text-muted)" }}>No data</div>;
  const kpis = [
    { icon: "🏛️", label: "Institutions", bn: "প্রতিষ্ঠান", value: stats.total_institutions, active: stats.active_institutions, sub: stats.suspended_institutions + " suspended", color: "#8b5cf6" },
    { icon: "👥", label: "Students", bn: "শিক্ষার্থী", value: stats.total_students, color: "#10b981" },
    { icon: "👨‍🏫", label: "Teachers", bn: "শিক্ষক", value: stats.total_teachers, color: "#14b8a6" },
    { icon: "📝", label: "Exams", bn: "পরীক্ষা", value: stats.total_exams, sub: stats.total_attempts + " attempts", color: "#06b6d4" },
  ];
  const revenue = [
    { label: "Collected Revenue", bn: "সংগৃহীত আয়", value: "৳" + Number(stats.total_revenue).toLocaleString(), color: "#10b981" },
    { label: "Pending Revenue", bn: "বাকি", value: "৳" + Number(stats.pending_revenue).toLocaleString(), color: "#f59e0b" },
    { label: "Total Users", bn: "মোট ব্যবহারকারী", value: stats.total_users, color: "#8b5cf6" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            <div className="text-[22px]">{k.icon}</div>
            <div className="mt-2 text-[26px] font-bold" style={{ color: k.color }}>{k.value}</div>
            <div className="text-fluid-micro font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{k.label}</div>
            <div className="bangla text-fluid-micro" style={{ color: "var(--text-faint)" }}>{k.bn}</div>
            {k.sub && <div className="text-fluid-micro mt-1" style={{ color: "var(--text-faint)" }}>{k.sub}</div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {revenue.map((r) => (
          <div key={r.label} className="rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            <div className="text-fluid-micro font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{r.label}</div>
            <div className="mt-1 text-[24px] font-bold" style={{ color: r.color }}>{r.value}</div>
            <div className="bangla text-fluid-micro" style={{ color: "var(--text-faint)" }}>{r.bn}</div>
          </div>
        ))}
      </div>

      {stats.plans_breakdown && Array.isArray(stats.plans_breakdown) && stats.plans_breakdown.length > 0 && (
        <div className="rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="text-[13px] font-semibold mb-3">Subscription Distribution</div>
          <div className="space-y-2">
            {stats.plans_breakdown.map((p: any, i: number) => {
              const total = stats.plans_breakdown.reduce((s: number, x: any) => s + Number(x.count), 0);
              const pct = total > 0 ? Math.round((Number(p.count) / total) * 100) : 0;
              const colors = ["#10b981", "#14b8a6", "#8b5cf6", "#f59e0b"];
              return (
                <div key={i}>
                  <div className="flex justify-between text-fluid-caption mb-1">
                    <span className="font-medium capitalize">{p.name}</span>
                    <span style={{ color: "var(--text-muted)" }}>{p.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-soft)" }}>
                    <div className="h-full rounded-full" style={{ width: pct + "%", background: colors[i % colors.length] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function InstitutionsTable({
  institutions, totalCount, search, setSearch, filterStatus, setFilterStatus, onSuspend, onReactivate,
}: any) {
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or slug..."
          className="flex-1 min-w-[200px] rounded-full border px-4 py-2 text-[13px] outline-none"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-full border px-4 py-2 text-[13px] outline-none"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <option value="all">All ({totalCount})</option>
          <option value="active">Active only</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {institutions.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="text-[36px]">🏛️</div>
          <div className="mt-2 text-[14px] font-semibold">No institutions match</div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ background: "var(--bg-soft)" }}>
                <th className="text-left p-3 text-fluid-micro font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Institution</th>
                <th className="text-left p-3 text-fluid-micro font-semibold uppercase hidden md:table-cell" style={{ color: "var(--text-muted)" }}>Type</th>
                <th className="text-left p-3 text-fluid-micro font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Plan</th>
                <th className="text-left p-3 text-fluid-micro font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Status</th>
                <th className="text-right p-3 text-fluid-micro font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {institutions.map((i: any) => {
                const sub = i.subscriptions?.[0];
                const plan = sub?.subscription_plans;
                return (
                  <tr key={i.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                    <td className="p-3">
                      <div className="font-semibold">{i.name}</div>
                      <div className="text-fluid-micro font-mono" style={{ color: "var(--text-muted)" }}>/{i.slug}</div>
                      {i.suspended_reason && (
                        <div className="text-fluid-micro text-rose-600 mt-0.5">⚠️ {i.suspended_reason}</div>
                      )}
                    </td>
                    <td className="p-3 hidden md:table-cell capitalize" style={{ color: "var(--text-muted)" }}>{i.type?.replace("_", " ")}</td>
                    <td className="p-3">
                      <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-fluid-micro font-semibold text-violet-700">
                        {plan?.name || "Free"}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={"rounded-full px-2 py-0.5 text-fluid-micro font-semibold " +
                        (i.suspended_at ? "bg-rose-500/15 text-rose-700" :
                         sub?.status === "active" ? "bg-emerald-500/15 text-emerald-700" :
                         sub?.status === "trial" ? "bg-amber-500/15 text-amber-700" :
                         "bg-slate-500/10 text-fg-muted")}>
                        {i.suspended_at ? "suspended" : (sub?.status || "active")}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <Link href={"/institutions/view/?slug=" + i.slug}
                          className="rounded-full border px-2 py-1 text-fluid-micro font-medium"
                          style={{ borderColor: "var(--border)" }}>View</Link>
                        {i.suspended_at ? (
                          <button onClick={() => onReactivate(i.id)}
                            className="rounded-full bg-emerald-500/15 px-2 py-1 text-fluid-micro font-semibold text-emerald-700">
                            Reactivate
                          </button>
                        ) : (
                          <button onClick={() => onSuspend(i.id)}
                            className="rounded-full bg-rose-500/15 px-2 py-1 text-fluid-micro font-semibold text-rose-700">
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PlansView() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("subscription_plans").select("*")
        .order("sort_order");
      setPlans(data ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="text-center py-10 text-[13px]" style={{ color: "var(--text-muted)" }}>Loading plans...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {plans.map((p, i) => {
        const colors = ["#64748b", "#10b981", "#8b5cf6", "#f59e0b"];
        const color = colors[i % colors.length];
        return (
          <div key={p.id} className="rounded-2xl border p-5 relative overflow-hidden"
            style={{ borderColor: color + "40", background: "var(--surface-3)" }}>
            <div className="absolute top-0 inset-x-0 h-1" style={{ background: color }} />
            <div className="text-fluid-micro font-bold uppercase tracking-widest" style={{ color }}>{p.code}</div>
            <div className="mt-2 text-[20px] font-bold">{p.name}</div>
            <div className="bangla text-fluid-caption" style={{ color: "var(--text-muted)" }}>{p.name_bn}</div>
            <div className="mt-3 text-[28px] font-bold" style={{ color }}>
              ৳{Number(p.price_bdt).toLocaleString()}
              <span className="text-fluid-caption font-normal" style={{ color: "var(--text-muted)" }}>/month</span>
            </div>
            <div className="mt-4 space-y-1.5 text-fluid-caption">
              <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>Students</span><span className="font-semibold">{p.max_students?.toLocaleString()}</span></div>
              <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>Teachers</span><span className="font-semibold">{p.max_teachers?.toLocaleString()}</span></div>
              <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>Classes</span><span className="font-semibold">{p.max_classes?.toLocaleString()}</span></div>
              <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>Storage</span><span className="font-semibold">{p.max_storage_mb} MB</span></div>
            </div>
            <div className="mt-4 pt-3 border-t space-y-1" style={{ borderColor: "var(--border)" }}>
              {Object.entries(p.features || {}).map(([k, v]: any) => (
                <div key={k} className="flex items-center gap-2 text-fluid-micro">
                  <span style={{ color: v ? "#10b981" : "#94a3b8" }}>{v ? "✓" : "✕"}</span>
                  <span style={{ color: v ? "var(--text)" : "var(--text-muted)" }} className="capitalize">
                    {k.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
