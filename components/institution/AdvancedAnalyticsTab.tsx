"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { exportToCSV } from "@/lib/exportData";

export default function AdvancedAnalyticsTab({ institutionId }: { institutionId: string }) {
  const [data, setData] = useState<any>(null);
  const [atRisk, setAtRisk] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);

  const load = async () => {
    setLoading(true);
    const [a, r] = await Promise.all([
      supabase.rpc("institution_analytics", { p_institution_id: institutionId }),
      supabase.rpc("at_risk_students", { p_institution_id: institutionId, p_limit: 50 }),
    ]);
    setData(a.data);
    setAtRisk(r.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [institutionId]);

  const computeRisks = async () => {
    if (!confirm("Recompute risk for all students? (~30 seconds)")) return;
    setComputing(true);
    const { data, error } = await supabase.rpc("compute_institution_risks", { p_institution_id: institutionId });
    setComputing(false);
    if (error) { alert(error.message); return; }
    alert("✅ Computed for " + (data as any).computed + " students");
    await load();
  };

  const exportRisk = () => {
    const headers = ["Student", "Student ID", "Class", "Risk Level", "Score", "Factors"];
    const rows = atRisk.map((r) => [
      r.full_name, r.student_code || "", r.class_name || "",
      r.risk_level, r.risk_score, JSON.stringify(r.factors || {}),
    ]);
    exportToCSV("at-risk-students", headers, rows);
  };

  if (loading || !data) return <div className="text-center py-10 text-[13px]" style={{ color: "var(--text-muted)" }}>Loading analytics...</div>;

  const fees = data.fees || {};
  const feeRate = Number(fees.expected) > 0 ? Math.round((Number(fees.collected) / Number(fees.expected)) * 100) : 0;
  const attRate = Number(data.attendance?.rate_30d || 0);
  const examAvg = Number(data.exams?.avg_score || 0);

  return (
    <div className="space-y-5">
      {/* Quick header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-[16px] font-semibold">Advanced Analytics · <span className="bangla font-normal">বিশ্লেষণ</span></h2>
          <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>Real-time insights + AI risk detection</div>
        </div>
        <div className="flex gap-2">
          <button onClick={computeRisks} disabled={computing}
            className="rounded-full bg-violet-500/15 px-3 py-1.5 text-[12px] font-semibold text-violet-700 disabled:opacity-50">
            {computing ? "Computing..." : "🧠 Recompute Risks"}
          </button>
          <button onClick={load}
            className="rounded-full border px-3 py-1.5 text-[12px] font-medium"
            style={{ borderColor: "var(--border)" }}>🔄 Refresh</button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Students" value={data.students?.total || 0} sub={(data.students?.active || 0) + " linked"} color="#10b981" emoji="👥" />
        <KPI label="Attendance (30d)" value={attRate + "%"} sub={(data.attendance?.today || 0) + " today"} color={attRate >= 80 ? "#10b981" : attRate >= 60 ? "#f59e0b" : "#f43f5e"} emoji="✅" />
        <KPI label="Exam Average" value={examAvg + "%"} sub={(data.exams?.total_attempts || 0) + " attempts"} color={examAvg >= 70 ? "#10b981" : examAvg >= 50 ? "#f59e0b" : "#f43f5e"} emoji="📊" />
        <KPI label="Fee Collection" value={feeRate + "%"} sub={"৳" + Number(fees.collected || 0).toLocaleString()} color={feeRate >= 80 ? "#10b981" : "#f59e0b"} emoji="💰" />
      </div>

      {/* Progress bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Fee Collection Progress" bn="ফি সংগ্রহ">
          <div className="flex justify-between text-[11px] mb-2">
            <span style={{ color: "var(--text-muted)" }}>Collected: ৳{Number(fees.collected || 0).toLocaleString()}</span>
            <span style={{ color: "var(--text-muted)" }}>Expected: ৳{Number(fees.expected || 0).toLocaleString()}</span>
          </div>
          <Bar pct={feeRate} from="#10b981" to="#14b8a6" />
          <div className="mt-3 flex justify-between text-[12px]">
            <span className="text-amber-700">Pending: ৳{Number(fees.pending || 0).toLocaleString()}</span>
            <span className="font-semibold">{feeRate}% collected</span>
          </div>
        </Card>

        <Card title="Attendance Rate (30 days)" bn="উপস্থিতির হার">
          <Bar pct={attRate} from="#10b981" to="#06b6d4" />
          <div className="mt-3 flex justify-between text-[12px]">
            <span style={{ color: "var(--text-muted)" }}>Average attendance</span>
            <span className={"font-semibold " + (attRate >= 80 ? "text-emerald-600" : attRate >= 60 ? "text-amber-600" : "text-rose-600")}>{attRate}%</span>
          </div>
        </Card>
      </div>

      {/* Risk Overview */}
      <Card title="Student Risk Overview" bn="শিক্ষার্থী ঝুঁকি">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-4 border" style={{ borderColor: "rgba(244,63,94,0.3)", background: "rgba(244,63,94,0.06)" }}>
            <div className="text-[28px] font-bold text-rose-600">{data.risk?.critical || 0}</div>
            <div className="text-[11px] uppercase font-semibold text-rose-700">Critical Risk</div>
            <div className="bangla text-[10px]" style={{ color: "var(--text-faint)" }}>অতি ঝুঁকিপূর্ণ</div>
          </div>
          <div className="rounded-xl p-4 border" style={{ borderColor: "rgba(249,115,22,0.3)", background: "rgba(249,115,22,0.06)" }}>
            <div className="text-[28px] font-bold text-orange-600">{data.risk?.high || 0}</div>
            <div className="text-[11px] uppercase font-semibold text-orange-700">High Risk</div>
            <div className="bangla text-[10px]" style={{ color: "var(--text-faint)" }}>উচ্চ ঝুঁকি</div>
          </div>
        </div>
      </Card>

      {/* At-risk table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[15px] font-semibold">⚠️ At-Risk Students ({atRisk.length})</h3>
          {atRisk.length > 0 && (
            <button onClick={exportRisk}
              className="rounded-full border px-3 py-1.5 text-[11px] font-medium"
              style={{ borderColor: "var(--border)" }}>📥 Export CSV</button>
          )}
        </div>

        {atRisk.length === 0 ? (
          <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            <div className="text-[36px]">✨</div>
            <div className="mt-2 text-[14px] font-semibold">No at-risk students</div>
            <div className="bangla text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>সব শিক্ষার্থী ভালো করছে</div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ background: "var(--bg-soft)" }}>
                  <th className="text-left p-2.5 font-semibold text-[10px] uppercase" style={{ color: "var(--text-muted)" }}>Student</th>
                  <th className="text-left p-2.5 font-semibold text-[10px] uppercase hidden sm:table-cell" style={{ color: "var(--text-muted)" }}>Class</th>
                  <th className="text-center p-2.5 font-semibold text-[10px] uppercase" style={{ color: "var(--text-muted)" }}>Level</th>
                  <th className="text-center p-2.5 font-semibold text-[10px] uppercase" style={{ color: "var(--text-muted)" }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {atRisk.map((r) => (
                  <tr key={r.student_id} className="border-t" style={{ borderColor: "var(--border)" }}>
                    <td className="p-2.5">
                      <div className="font-semibold">{r.full_name}</div>
                      <div className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>{r.student_code}</div>
                    </td>
                    <td className="p-2.5 hidden sm:table-cell" style={{ color: "var(--text-muted)" }}>
                      {r.class_name}{r.section ? " · " + r.section : ""}
                    </td>
                    <td className="p-2.5 text-center">
                      <span className={"rounded-full px-2 py-0.5 text-[10px] font-bold " +
                        (r.risk_level === "critical" ? "bg-rose-500/15 text-rose-700" : "bg-orange-500/15 text-orange-700")}>
                        {r.risk_level.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-2.5 text-center font-bold">{r.risk_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
        <div className="text-[13px] font-semibold mb-3">📌 How Risk is Calculated</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
          <div className="rounded-xl p-3" style={{ background: "var(--bg-soft)" }}>
            <div className="font-semibold mb-1">✅ Attendance</div>
            <div style={{ color: "var(--text-muted)" }}>30-day rate; low attendance = higher risk</div>
          </div>
          <div className="rounded-xl p-3" style={{ background: "var(--bg-soft)" }}>
            <div className="font-semibold mb-1">📊 Exam Average</div>
            <div style={{ color: "var(--text-muted)" }}>Graded exam % — below 60% adds risk</div>
          </div>
          <div className="rounded-xl p-3" style={{ background: "var(--bg-soft)" }}>
            <div className="font-semibold mb-1">💰 Fee Due</div>
            <div style={{ color: "var(--text-muted)" }}>Pending dues add risk factor</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, sub, color, emoji }: any) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
      <div className="text-[18px]">{emoji}</div>
      <div className="mt-1 text-[24px] font-bold" style={{ color }}>{value}</div>
      <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{label}</div>
      {sub && <div className="text-[10px]" style={{ color: "var(--text-faint)" }}>{sub}</div>}
    </div>
  );
}
function Card({ title, bn, children }: any) {
  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
      <div className="text-[13px] font-semibold mb-3">{title} <span className="bangla font-normal text-[11px]" style={{ color: "var(--text-muted)" }}>· {bn}</span></div>
      {children}
    </div>
  );
}
function Bar({ pct, from, to }: any) {
  return (
    <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--bg-soft)" }}>
      <div className="h-full rounded-full transition-all" style={{ width: Math.min(100, Math.max(0, pct)) + "%", background: "linear-gradient(90deg," + from + "," + to + ")" }} />
    </div>
  );
}
