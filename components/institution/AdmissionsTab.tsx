"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdmissionsTab({ institutionId, isAdmin }: { institutionId: string; isAdmin: boolean }) {
  const [apps, setApps] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");
  const [selected, setSelected] = useState<any>(null);
  const [acting, setActing] = useState(false);

  const load = async () => {
    setLoading(true);
    let q = supabase.from("admission_applications").select("*").eq("institution_id", institutionId).order("created_at", { ascending: false }).limit(100);
    if (filter !== "all") q = q.eq("status", filter);
    const [a, s] = await Promise.all([q, supabase.rpc("admission_stats", { p_institution_id: institutionId })]);
    setApps(a.data ?? []);
    setStats(s.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [institutionId, filter]);

  const approve = async (id: string) => {
    if (!confirm("Approve → will create student record automatically. Continue?")) return;
    setActing(true);
    const { data, error } = await supabase.rpc("approve_admission", { p_application_id: id, p_notes: null });
    setActing(false);
    if (error) { alert(error.message); return; }
    alert("✅ Student created + enrolled");
    setSelected(null);
    await load();
  };

  const setStatus = async (id: string, status: string) => {
    let notes: string | null = null;
    if (status === "rejected") {
      notes = prompt("Reason:");
      if (!notes) return;
    }
    setActing(true);
    const { error } = await supabase.rpc("update_admission_status", { p_application_id: id, p_status: status, p_notes: notes });
    setActing(false);
    if (error) { alert(error.message); return; }
    setSelected(null);
    await load();
  };

  const shareLink = () => {
    // Find slug first
    supabase.from("institutions").select("slug").eq("id", institutionId).single().then(({ data }) => {
      if (!data) return;
      const url = window.location.origin + "/skb-education-ecosystem/admission/?school=" + data.slug;
      navigator.clipboard.writeText(url);
      alert("✅ Admission link copied!\n\n" + url);
    });
  };

  if (!isAdmin) return <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}><div className="text-[36px]">🔒</div><div className="mt-2 text-[14px] font-semibold">Admin access required</div></div>;

  if (selected) {
    const statusMeta: any = {
      pending: "bg-amber-500/15 text-amber-700",
      under_review: "bg-cyan-500/15 text-cyan-700",
      shortlisted: "bg-violet-500/15 text-violet-700",
      approved: "bg-emerald-500/15 text-emerald-700",
      rejected: "bg-rose-500/15 text-rose-700",
      enrolled: "bg-emerald-500/15 text-emerald-700",
    };
    return (
      <div>
        <button onClick={() => setSelected(null)} className="text-[13px] mb-3" style={{ color: "var(--text-muted)" }}>← Back</button>
        <div className="rounded-2xl border p-6 space-y-4" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-[20px] font-semibold">{selected.applicant_name}</div>
              <div className="text-[12px] font-mono" style={{ color: "var(--text-muted)" }}>{selected.application_no}</div>
            </div>
            <span className={"rounded-full px-3 py-1 text-[11px] font-semibold capitalize " + (statusMeta[selected.status] || "")}>{selected.status}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-[12px]">
            <Info l="Class Applied" v={selected.class_name || "—"} />
            <Info l="Gender" v={selected.gender || "—"} />
            <Info l="DOB" v={selected.applicant_dob || "—"} />
            <Info l="Blood Group" v={selected.blood_group || "—"} />
            <Info l="Religion" v={selected.religion || "—"} />
            <Info l="Quota" v={selected.quota || "—"} />
            <Info l="Guardian" v={selected.guardian_name + " (" + (selected.guardian_relation || "—") + ")"} />
            <Info l="Guardian Phone" v={selected.guardian_phone} />
            <Info l="Guardian Email" v={selected.guardian_email || "—"} />
            <Info l="Prev School" v={selected.previous_school || "—"} />
            <Info l="Prev Class" v={selected.previous_class || "—"} />
          </div>

          {selected.address && (
            <div>
              <div className="text-[11px] uppercase font-bold mb-1" style={{ color: "var(--text-muted)" }}>Address</div>
              <div className="text-[13px]">{selected.address}</div>
            </div>
          )}

          {selected.status !== "enrolled" && selected.status !== "rejected" && (
            <div className="flex flex-wrap gap-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
              {selected.status === "pending" && (
                <button onClick={() => setStatus(selected.id, "under_review")} disabled={acting}
                  className="rounded-full bg-cyan-500/15 px-4 py-2 text-[12px] font-semibold text-cyan-700 disabled:opacity-50">
                  🔍 Start Review
                </button>
              )}
              {(selected.status === "pending" || selected.status === "under_review") && (
                <button onClick={() => setStatus(selected.id, "shortlisted")} disabled={acting}
                  className="rounded-full bg-violet-500/15 px-4 py-2 text-[12px] font-semibold text-violet-700 disabled:opacity-50">
                  ⭐ Shortlist
                </button>
              )}
              <button onClick={() => approve(selected.id)} disabled={acting}
                className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-2 text-[12px] font-semibold text-white shadow disabled:opacity-50">
                ✅ Approve & Enroll
              </button>
              <button onClick={() => setStatus(selected.id, "rejected")} disabled={acting}
                className="rounded-full bg-rose-500/15 px-4 py-2 text-[12px] font-semibold text-rose-700 disabled:opacity-50">
                ❌ Reject
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-[16px] font-semibold">Admissions · <span className="bangla font-normal">ভর্তি</span></h2>
        <button onClick={shareLink}
          className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow">
          🔗 Copy Admission Link
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          <S e="📥" v={stats.total} l="Total" />
          <S e="⏳" v={stats.pending} l="Pending" />
          <S e="🔍" v={stats.under_review} l="Review" />
          <S e="✅" v={stats.enrolled} l="Enrolled" />
          <S e="📅" v={stats.this_month} l="This Month" />
        </div>
      )}

      <div className="flex gap-1 rounded-full border p-1 mb-4 text-[12px] w-fit overflow-x-auto"
        style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
        {["pending","under_review","shortlisted","enrolled","rejected","all"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={"rounded-full px-3 py-1.5 font-medium whitespace-nowrap capitalize " + (filter === f ? "bg-[var(--text)] text-[var(--bg)]" : "")}
            style={filter !== f ? { color: "var(--text-muted)" } : {}}>{f.replace("_", " ")}</button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-[13px]" style={{ color: "var(--text-muted)" }}>Loading...</div>
      ) : apps.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="text-[36px]">📥</div>
          <div className="mt-2 text-[14px] font-semibold">No {filter} applications</div>
        </div>
      ) : (
        <div className="space-y-2">
          {apps.map((a) => (
            <button key={a.id} onClick={() => setSelected(a)}
              className="w-full rounded-2xl border p-4 text-left hover:-translate-y-0.5 hover:shadow-md transition"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold">{a.applicant_name}</div>
                  <div className="text-[11px] mt-0.5 font-mono" style={{ color: "var(--text-muted)" }}>{a.application_no}</div>
                  <div className="flex flex-wrap gap-2 mt-2 text-[11px]" style={{ color: "var(--text-muted)" }}>
                    <span>🎓 {a.class_name || "—"}</span>
                    <span>👨 {a.guardian_name}</span>
                    <span>📞 {a.guardian_phone}</span>
                  </div>
                </div>
                <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
                  {new Date(a.created_at).toLocaleDateString()}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function S({ e, v, l }: any) {
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
      <div className="text-[16px]">{e}</div>
      <div className="text-[20px] font-bold mt-0.5">{v}</div>
      <div className="text-[10px] uppercase font-medium" style={{ color: "var(--text-muted)" }}>{l}</div>
    </div>
  );
}
function Info({ l, v }: any) {
  return (
    <div>
      <div className="text-[10px] uppercase font-semibold" style={{ color: "var(--text-faint)" }}>{l}</div>
      <div className="text-[13px] font-medium mt-0.5">{v}</div>
    </div>
  );
}
