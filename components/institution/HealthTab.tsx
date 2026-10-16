"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function HealthTab({ institutionId, isAdmin }: { institutionId: string; isAdmin: boolean }) {
  const [view, setView] = useState<"overview"|"incidents">("overview");
  const [students, setStudents] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [showIncident, setShowIncident] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    student_id: "", incident_type: "other", severity: "low", description: "", treatment: "",
  });

  const load = async () => {
    setLoading(true);
    const [sRes, iRes, hRes] = await Promise.all([
      supabase.from("students").select("id, full_name, student_id, class_id, classes:class_id(name, section)").eq("institution_id", institutionId).order("full_name"),
      supabase.from("health_incidents").select("*, students:student_id(full_name, student_id)").eq("institution_id", institutionId).order("incident_at", { ascending: false }).limit(50),
      supabase.rpc("health_stats", { p_institution_id: institutionId }),
    ]);
    setStudents(sRes.data ?? []);
    setIncidents(iRes.data ?? []);
    setStats(hRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [institutionId]);

  const addIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_id || !form.description.trim()) { setErr("Student + Description"); return; }
    setSaving(true); setErr("");
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("health_incidents").insert({
      institution_id: institutionId, student_id: form.student_id,
      incident_type: form.incident_type, severity: form.severity,
      description: form.description.trim(), treatment: form.treatment.trim() || null,
      reported_by: u.user?.id,
    });
    setSaving(false);
    if (error) { setErr(error.message); return; }
    setForm({ student_id: "", incident_type: "other", severity: "low", description: "", treatment: "" });
    setShowIncident(false); await load();
  };

  if (!isAdmin) return <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}><div className="text-[36px]">🔒</div><div className="mt-2 text-[14px] font-semibold">Admin access required</div></div>;

  const filtered = students.filter((s) => !search || s.full_name.toLowerCase().includes(search.toLowerCase()) || (s.student_id || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-[16px] font-semibold">Health Records · <span className="bangla font-normal">স্বাস্থ্য রেকর্ড</span></h2>
        <button onClick={() => setShowIncident(!showIncident)} className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow">
          {showIncident ? "Cancel" : "+ Report Incident"}
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <S emoji="📋" v={stats.with_records} l="With Records" />
          <S emoji="🏥" v={stats.incidents_this_month} l="This Month" />
          <S emoji="🚨" v={stats.critical_incidents} l="Critical" />
          <S emoji="⚠️" v={stats.allergies_flagged} l="Allergies" />
        </div>
      )}

      {showIncident && (
        <form onSubmit={addIncident} className="mb-4 rounded-2xl border p-4 space-y-3" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <select required value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} className="w-full rounded-xl border px-3.5 py-2 text-[13px] outline-none" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            <option value="">— Student * —</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <select value={form.incident_type} onChange={(e) => setForm({ ...form, incident_type: e.target.value })} className="rounded-xl border px-3.5 py-2 text-[13px] outline-none" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <option value="injury">🤕 Injury</option>
              <option value="illness">🤒 Illness</option>
              <option value="fever">🌡️ Fever</option>
              <option value="accident">🚑 Accident</option>
              <option value="allergy">⚠️ Allergy</option>
              <option value="emergency">🚨 Emergency</option>
              <option value="other">📌 Other</option>
            </select>
            <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} className="rounded-xl border px-3.5 py-2 text-[13px] outline-none" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <option value="low">🟢 Low</option>
              <option value="medium">🟡 Medium</option>
              <option value="high">🟠 High</option>
              <option value="critical">🔴 Critical</option>
            </select>
          </div>
          <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Description *"
            className="w-full rounded-xl border px-3.5 py-2 text-[13px] outline-none resize-none" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
          <textarea value={form.treatment} onChange={(e) => setForm({ ...form, treatment: e.target.value })} rows={2} placeholder="Treatment given"
            className="w-full rounded-xl border px-3.5 py-2 text-[13px] outline-none resize-none" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
          {err && <div className="text-[12px] text-rose-600">{err}</div>}
          <button type="submit" disabled={saving} className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-2 text-[13px] font-semibold text-white disabled:opacity-50">{saving ? "..." : "Report"}</button>
        </form>
      )}

      <div className="flex gap-1 rounded-full border p-1 mb-4 text-[12px] w-fit" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
        <button onClick={() => setView("overview")} className={"rounded-full px-3 py-1.5 font-medium " + (view === "overview" ? "bg-[var(--text)] text-[var(--bg)]" : "")} style={view !== "overview" ? { color: "var(--text-muted)" } : {}}>👥 Students</button>
        <button onClick={() => setView("incidents")} className={"rounded-full px-3 py-1.5 font-medium " + (view === "incidents" ? "bg-[var(--text)] text-[var(--bg)]" : "")} style={view !== "incidents" ? { color: "var(--text-muted)" } : {}}>🏥 Incidents ({incidents.length})</button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-[13px]" style={{ color: "var(--text-muted)" }}>Loading...</div>
      ) : view === "overview" ? (
        <>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Search students..."
            className="w-full rounded-full border px-4 py-2 text-[13px] outline-none mb-3"
            style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
          {filtered.length === 0 ? <Empty e="👥" t="No students" /> : (
            <div className="space-y-2">
              {filtered.map((s) => (
                <button key={s.id} onClick={() => setSelected(s)}
                  className="w-full rounded-2xl border p-3 flex items-center gap-3 text-left hover:bg-[var(--bg-soft)]"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold text-white" style={{ background: "linear-gradient(135deg,#10b981,#14b8a6)" }}>
                    {s.full_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold truncate">{s.full_name}</div>
                    <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {s.student_id} {s.classes && <>· {s.classes.name}{s.classes.section ? " · " + s.classes.section : ""}</>}
                    </div>
                  </div>
                  <span className="text-[11px] text-emerald-600 font-medium">Open →</span>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        incidents.length === 0 ? <Empty e="🏥" t="No incidents" /> : (
          <div className="space-y-2">
            {incidents.map((i) => {
              const sevColor: any = { low: "bg-emerald-500/15 text-emerald-700", medium: "bg-amber-500/15 text-amber-700", high: "bg-orange-500/15 text-orange-700", critical: "bg-rose-500/15 text-rose-700" };
              return (
                <div key={i.id} className="rounded-2xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="text-[13px] font-semibold">{i.students?.full_name}</div>
                        <span className={"rounded-full px-2 py-0.5 text-[10px] font-semibold " + sevColor[i.severity]}>{i.severity}</span>
                        <span className="rounded-full bg-[var(--bg-soft)] px-2 py-0.5 text-[10px] capitalize">{i.incident_type}</span>
                      </div>
                      <div className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>{new Date(i.incident_at).toLocaleString()}</div>
                      <div className="mt-2 text-[12px]">{i.description}</div>
                      {i.treatment && <div className="text-[11px] mt-1 italic" style={{ color: "var(--text-muted)" }}>💊 {i.treatment}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {selected && <HealthProfileModal student={selected} institutionId={institutionId} onClose={() => setSelected(null)} />}
    </div>
  );
}

function HealthProfileModal({ student, institutionId, onClose }: any) {
  const [rec, setRec] = useState<any>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [vax, setVax] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({ blood_group: "", allergies: "", chronic_conditions: "", emergency_contact_name: "", emergency_contact_phone: "", notes: "" });

  const load = async () => {
    setLoading(true);
    const [r, i, v] = await Promise.all([
      supabase.from("student_health").select("*").eq("student_id", student.id).maybeSingle(),
      supabase.from("health_incidents").select("*").eq("student_id", student.id).order("incident_at", { ascending: false }),
      supabase.from("vaccinations").select("*").eq("student_id", student.id).order("administered_date", { ascending: false }),
    ]);
    setRec(r.data);
    setIncidents(i.data ?? []);
    setVax(v.data ?? []);
    if (r.data) {
      setForm({
        blood_group: r.data.blood_group || "",
        allergies: Array.isArray(r.data.allergies) ? r.data.allergies.join(", ") : "",
        chronic_conditions: Array.isArray(r.data.chronic_conditions) ? r.data.chronic_conditions.join(", ") : "",
        emergency_contact_name: r.data.emergency_contact_name || "",
        emergency_contact_phone: r.data.emergency_contact_phone || "",
        notes: r.data.notes || "",
      });
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, [student.id]);

  const save = async () => {
    setSaving(true);
    const toArr = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
    const { error } = await supabase.from("student_health").upsert({
      student_id: student.id,
      blood_group: form.blood_group || null,
      allergies: toArr(form.allergies),
      chronic_conditions: toArr(form.chronic_conditions),
      emergency_contact_name: form.emergency_contact_name || null,
      emergency_contact_phone: form.emergency_contact_phone || null,
      notes: form.notes || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "student_id" });
    setSaving(false);
    if (error) { alert(error.message); return; }
    setEditing(false);
    await load();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur p-4 overflow-y-auto">
      <div className="w-full max-w-2xl my-8 rounded-3xl border shadow-2xl" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--border)" }}>
          <div>
            <div className="text-[16px] font-semibold">{student.full_name}</div>
            <div className="text-[12px]" style={{ color: "var(--text-muted)" }}>{student.student_id}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-[var(--bg-soft)]">✕</button>
        </div>
        <div className="p-5 space-y-4">
          {loading ? <div className="text-center py-10 text-[13px]" style={{ color: "var(--text-muted)" }}>Loading...</div> : (
            <>
              <div className="flex justify-between items-center">
                <div className="text-[13px] font-semibold">Health Info</div>
                {!editing && <button onClick={() => setEditing(true)} className="text-[12px] font-medium text-emerald-700">Edit</button>}
              </div>
              {editing ? (
                <div className="space-y-3">
                  <input type="text" value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })} placeholder="Blood group" className="w-full rounded-xl border px-3.5 py-2 text-[13px]" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
                  <input type="text" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} placeholder="Allergies (comma-separated)" className="w-full rounded-xl border px-3.5 py-2 text-[13px]" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
                  <input type="text" value={form.chronic_conditions} onChange={(e) => setForm({ ...form, chronic_conditions: e.target.value })} placeholder="Chronic conditions" className="w-full rounded-xl border px-3.5 py-2 text-[13px]" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
                  <input type="text" value={form.emergency_contact_name} onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })} placeholder="Emergency contact name" className="w-full rounded-xl border px-3.5 py-2 text-[13px]" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
                  <input type="text" value={form.emergency_contact_phone} onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })} placeholder="Emergency phone" className="w-full rounded-xl border px-3.5 py-2 text-[13px]" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" rows={2} className="w-full rounded-xl border px-3.5 py-2 text-[13px] resize-none" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
                  <div className="flex gap-2">
                    <button onClick={save} disabled={saving} className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-2 text-[13px] font-semibold text-white disabled:opacity-50">{saving ? "..." : "Save"}</button>
                    <button onClick={() => setEditing(false)} className="rounded-full border px-5 py-2 text-[13px]" style={{ borderColor: "var(--border)" }}>Cancel</button>
                  </div>
                </div>
              ) : rec ? (
                <div className="grid grid-cols-2 gap-3 text-[12px]">
                  {rec.blood_group && <Row l="Blood" v={rec.blood_group} />}
                  {rec.allergies?.length > 0 && <Row l="Allergies" v={rec.allergies.join(", ")} />}
                  {rec.chronic_conditions?.length > 0 && <Row l="Conditions" v={rec.chronic_conditions.join(", ")} />}
                  {rec.emergency_contact_name && <Row l="Emergency" v={rec.emergency_contact_name + " " + (rec.emergency_contact_phone || "")} />}
                </div>
              ) : (
                <div className="text-[12px] text-center py-4" style={{ color: "var(--text-muted)" }}>No health info yet</div>
              )}

              <div>
                <div className="text-[13px] font-semibold mb-2">Recent Incidents ({incidents.length})</div>
                {incidents.slice(0, 5).map((i) => (
                  <div key={i.id} className="rounded-xl border p-2 mb-1.5 text-[12px]" style={{ borderColor: "var(--border)" }}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">{i.incident_type}</span>
                      <span className="text-[10px] capitalize" style={{ color: "var(--text-muted)" }}>{i.severity}</span>
                      <span className="ml-auto text-[10px]" style={{ color: "var(--text-faint)" }}>{new Date(i.incident_at).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-1">{i.description}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ l, v }: any) {
  return (
    <div>
      <div className="text-[10px] uppercase font-semibold" style={{ color: "var(--text-faint)" }}>{l}</div>
      <div className="text-[12px] font-medium">{v}</div>
    </div>
  );
}
function S({ emoji, v, l }: any) {
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
      <div className="text-[18px]">{emoji}</div>
      <div className="text-[20px] font-bold mt-1">{v}</div>
      <div className="text-[10px] uppercase font-medium" style={{ color: "var(--text-muted)" }}>{l}</div>
    </div>
  );
}
function Empty({ e, t }: any) {
  return (
    <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
      <div className="text-[36px]">{e}</div>
      <div className="mt-2 text-[14px] font-semibold">{t}</div>
    </div>
  );
}
