"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AnalyticsTab({ institutionId }: { institutionId: string }) {
  const [stats, setStats] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [sRes, aRes] = await Promise.all([
        supabase.rpc("institution_dashboard_stats", { p_institution_id: institutionId }),
        supabase.rpc("attendance_summary", { p_institution_id: institutionId, p_days: 30 }),
      ]);
      setStats(sRes.data);
      setAttendance(aRes.data ?? []);
      setLoading(false);
    })();
  }, [institutionId]);

  if (loading) return <div className="text-center py-10 text-[13px]" style={{ color: "var(--text-muted)" }}>Loading analytics...</div>;

  const totalFees = Number(stats?.fees_collected ?? 0) + Number(stats?.fees_pending ?? 0);
  const collectionRate = totalFees > 0 ? Math.round((Number(stats?.fees_collected ?? 0) / totalFees) * 100) : 0;
  const avgAttendance = attendance.length > 0
    ? Math.round(attendance.reduce((s, a) => s + Number(a.percentage), 0) / attendance.length)
    : 0;

  return (
    <div className="space-y-5">
      {/* Big KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <BigKPI icon="👥" value={stats?.students ?? 0} label="Students" bn="শিক্ষার্থী" color="#10b981" />
        <BigKPI icon="👨‍🏫" value={stats?.teachers ?? 0} label="Teachers" bn="শিক্ষক" color="#14b8a6" />
        <BigKPI icon="📚" value={stats?.classes ?? 0} label="Classes" bn="শ্রেণি" color="#06b6d4" />
        <BigKPI icon="📝" value={stats?.exams ?? 0} label="Exams" bn="পরীক্ষা" color="#8b5cf6" />
      </div>

      {/* Progress bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[13px] font-semibold">📊 Attendance (30d avg)</div>
            <div className="text-[20px] font-bold text-emerald-600">{avgAttendance}%</div>
          </div>
          <ProgressBar pct={avgAttendance} from="#10b981" to="#14b8a6" />
          <div className="mt-2 text-[11px]" style={{ color: "var(--text-muted)" }}>
            আজ {stats?.attendance_today ?? 0} entry
          </div>
        </div>

        <div className="rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[13px] font-semibold">💰 Fee Collection</div>
            <div className="text-[20px] font-bold text-teal-600">{collectionRate}%</div>
          </div>
          <ProgressBar pct={collectionRate} from="#14b8a6" to="#06b6d4" />
          <div className="mt-2 flex justify-between text-[11px]" style={{ color: "var(--text-muted)" }}>
            <span className="text-emerald-600">৳{Number(stats?.fees_collected ?? 0).toLocaleString()} collected</span>
            <span className="text-amber-600">৳{Number(stats?.fees_pending ?? 0).toLocaleString()} pending</span>
          </div>
        </div>
      </div>

      {/* Activity */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SmallKPI label="Exam Attempts" bn="পরীক্ষা দিয়েছে" value={stats?.attempts ?? 0} />
        <SmallKPI label="Attendance Today" bn="আজ উপস্থিতি" value={stats?.attendance_today ?? 0} />
        <SmallKPI label="Fees Pending (৳)" bn="বকেয়া" value={Number(stats?.fees_pending ?? 0).toLocaleString()} />
        <SmallKPI label="Fees Collected (৳)" bn="সংগৃহীত" value={Number(stats?.fees_collected ?? 0).toLocaleString()} />
      </div>

      {/* Top attendees */}
      {attendance.length > 0 && (
        <div className="rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="text-[13px] font-semibold mb-3">🎯 Top Attendance (Last 30 Days)</div>
          <div className="space-y-2">
            {attendance.sort((a, b) => Number(b.percentage) - Number(a.percentage)).slice(0, 5).map((s, i) => (
              <div key={s.student_id} className="flex items-center gap-3">
                <div className="w-6 text-[11px] font-bold text-center" style={{ color: i < 3 ? "#10b981" : "var(--text-muted)" }}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "#" + (i + 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium truncate">{s.full_name}</div>
                </div>
                <div className="text-[12px] font-bold text-emerald-600">{s.percentage}%</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BigKPI({ icon, value, label, bn, color }: { icon: string; value: any; label: string; bn: string; color: string }) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
      <div className="flex items-center justify-between">
        <div className="text-[22px]">{icon}</div>
        <div className="h-8 w-8 rounded-full" style={{ background: color + "20" }} />
      </div>
      <div className="mt-2 text-[26px] font-bold" style={{ color }}>{value}</div>
      <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{label}</div>
      <div className="bangla text-[10px]" style={{ color: "var(--text-faint)" }}>{bn}</div>
    </div>
  );
}

function SmallKPI({ label, bn, value }: { label: string; bn: string; value: any }) {
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--bg-soft)" }}>
      <div className="text-[16px] font-semibold">{value}</div>
      <div className="text-[10px] uppercase font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</div>
      <div className="bangla text-[10px]" style={{ color: "var(--text-faint)" }}>{bn}</div>
    </div>
  );
}

function ProgressBar({ pct, from, to }: { pct: number; from: string; to: string }) {
  return (
    <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-soft)" }}>
      <div className="h-full rounded-full transition-all"
        style={{ width: Math.min(100, Math.max(0, pct)) + "%", background: "linear-gradient(90deg," + from + "," + to + ")" }} />
    </div>
  );
}
