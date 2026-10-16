"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TransportTab({ institutionId, isAdmin }: { institutionId: string; isAdmin: boolean }) {
  const [view, setView] = useState<"routes"|"vehicles"|"assignments">("routes");
  const [routes, setRoutes] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRoute, setShowRoute] = useState(false);
  const [showVehicle, setShowVehicle] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [rForm, setRForm] = useState({ name: "", route_code: "", start_point: "", end_point: "", monthly_fee: 0, capacity: 50 });
  const [vForm, setVForm] = useState({ route_id: "", registration_no: "", model: "", capacity: 50, driver_name: "", driver_phone: "" });
  const [aForm, setAForm] = useState({ student_id: "", route_id: "", vehicle_id: "" });

  const load = async () => {
    setLoading(true);
    const [rRes, vRes, aRes, sRes, stRes] = await Promise.all([
      supabase.from("transport_routes").select("*").eq("institution_id", institutionId).order("name"),
      supabase.from("transport_vehicles").select("*, transport_routes:route_id(name)").eq("institution_id", institutionId).order("registration_no"),
      supabase.from("transport_assignments").select("*, students:student_id(full_name, student_id), transport_routes:route_id(name)").eq("institution_id", institutionId).eq("is_active", true),
      supabase.from("students").select("id, full_name, student_id").eq("institution_id", institutionId).order("full_name"),
      supabase.rpc("transport_stats", { p_institution_id: institutionId }),
    ]);
    setRoutes(rRes.data ?? []);
    setVehicles(vRes.data ?? []);
    setAssignments(aRes.data ?? []);
    setStudents(sRes.data ?? []);
    setStats(stRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [institutionId]);

  const addRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setErr("");
    const { error } = await supabase.from("transport_routes").insert({
      institution_id: institutionId, name: rForm.name.trim(),
      route_code: rForm.route_code.trim() || null,
      start_point: rForm.start_point.trim() || null,
      end_point: rForm.end_point.trim() || null,
      monthly_fee: rForm.monthly_fee, capacity: rForm.capacity,
    });
    setSaving(false);
    if (error) { setErr(error.message); return; }
    setRForm({ name: "", route_code: "", start_point: "", end_point: "", monthly_fee: 0, capacity: 50 });
    setShowRoute(false); await load();
  };

  const addVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setErr("");
    const { error } = await supabase.from("transport_vehicles").insert({
      institution_id: institutionId, route_id: vForm.route_id || null,
      registration_no: vForm.registration_no.trim(), model: vForm.model.trim() || null,
      capacity: vForm.capacity, driver_name: vForm.driver_name.trim() || null,
      driver_phone: vForm.driver_phone.trim() || null,
    });
    setSaving(false);
    if (error) { setErr(error.message); return; }
    setVForm({ route_id: "", registration_no: "", model: "", capacity: 50, driver_name: "", driver_phone: "" });
    setShowVehicle(false); await load();
  };

  const addAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aForm.student_id || !aForm.route_id) { setErr("Student + Route select করুন"); return; }
    setSaving(true); setErr("");
    const { error } = await supabase.from("transport_assignments").insert({
      institution_id: institutionId,
      student_id: aForm.student_id, route_id: aForm.route_id,
      vehicle_id: aForm.vehicle_id || null,
    });
    setSaving(false);
    if (error) { setErr(error.message); return; }
    setAForm({ student_id: "", route_id: "", vehicle_id: "" });
    setShowAssign(false); await load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-[16px] font-semibold">Transport · <span className="bangla font-normal">পরিবহন</span></h2>
        <div className="flex gap-2 flex-wrap">
          {view === "routes" && isAdmin && (
            <button onClick={() => setShowRoute(!showRoute)}
              className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow">
              {showRoute ? "Cancel" : "+ Route"}
            </button>
          )}
          {view === "vehicles" && isAdmin && (
            <button onClick={() => setShowVehicle(!showVehicle)}
              className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow">
              {showVehicle ? "Cancel" : "+ Vehicle"}
            </button>
          )}
          {view === "assignments" && isAdmin && (
            <button onClick={() => setShowAssign(!showAssign)}
              className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow">
              {showAssign ? "Cancel" : "+ Assign Student"}
            </button>
          )}
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <S emoji="🛣️" v={stats.total_routes} l="Routes" />
          <S emoji="🚌" v={stats.total_vehicles} l="Vehicles" />
          <S emoji="👥" v={stats.total_students} l="Students" />
          <S emoji="💺" v={stats.total_capacity} l="Capacity" />
        </div>
      )}

      {showRoute && isAdmin && (
        <form onSubmit={addRoute} className="mb-4 rounded-2xl border p-4 space-y-3" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="text" required value={rForm.name} onChange={(e) => setRForm({ ...rForm, name: e.target.value })} placeholder="Route name *" className="rounded-xl border px-3.5 py-2 text-[13px] outline-none" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <input type="text" value={rForm.route_code} onChange={(e) => setRForm({ ...rForm, route_code: e.target.value })} placeholder="Route code" className="rounded-xl border px-3.5 py-2 text-[13px] outline-none" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <input type="text" value={rForm.start_point} onChange={(e) => setRForm({ ...rForm, start_point: e.target.value })} placeholder="Start point" className="rounded-xl border px-3.5 py-2 text-[13px] outline-none" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <input type="text" value={rForm.end_point} onChange={(e) => setRForm({ ...rForm, end_point: e.target.value })} placeholder="End point" className="rounded-xl border px-3.5 py-2 text-[13px] outline-none" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <input type="number" value={rForm.monthly_fee} onChange={(e) => setRForm({ ...rForm, monthly_fee: parseInt(e.target.value) || 0 })} placeholder="Monthly fee (৳)" className="rounded-xl border px-3.5 py-2 text-[13px] outline-none" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <input type="number" value={rForm.capacity} onChange={(e) => setRForm({ ...rForm, capacity: parseInt(e.target.value) || 50 })} placeholder="Capacity" className="rounded-xl border px-3.5 py-2 text-[13px] outline-none" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
          </div>
          {err && <div className="text-[12px] text-rose-600">{err}</div>}
          <button type="submit" disabled={saving} className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-2 text-[13px] font-semibold text-white disabled:opacity-50">{saving ? "..." : "Save Route"}</button>
        </form>
      )}

      {showVehicle && isAdmin && (
        <form onSubmit={addVehicle} className="mb-4 rounded-2xl border p-4 space-y-3" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select value={vForm.route_id} onChange={(e) => setVForm({ ...vForm, route_id: e.target.value })} className="rounded-xl border px-3.5 py-2 text-[13px] outline-none" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <option value="">— Route (optional) —</option>
              {routes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <input type="text" required value={vForm.registration_no} onChange={(e) => setVForm({ ...vForm, registration_no: e.target.value })} placeholder="Registration no * e.g. DHAKA-METRO-1234" className="rounded-xl border px-3.5 py-2 text-[13px] outline-none font-mono" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <input type="text" value={vForm.model} onChange={(e) => setVForm({ ...vForm, model: e.target.value })} placeholder="Model (e.g. Toyota Hiace)" className="rounded-xl border px-3.5 py-2 text-[13px] outline-none" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <input type="number" value={vForm.capacity} onChange={(e) => setVForm({ ...vForm, capacity: parseInt(e.target.value) || 50 })} placeholder="Capacity" className="rounded-xl border px-3.5 py-2 text-[13px] outline-none" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <input type="text" value={vForm.driver_name} onChange={(e) => setVForm({ ...vForm, driver_name: e.target.value })} placeholder="Driver name" className="rounded-xl border px-3.5 py-2 text-[13px] outline-none" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <input type="text" value={vForm.driver_phone} onChange={(e) => setVForm({ ...vForm, driver_phone: e.target.value })} placeholder="Driver phone" className="rounded-xl border px-3.5 py-2 text-[13px] outline-none" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
          </div>
          {err && <div className="text-[12px] text-rose-600">{err}</div>}
          <button type="submit" disabled={saving} className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-2 text-[13px] font-semibold text-white disabled:opacity-50">{saving ? "..." : "Save Vehicle"}</button>
        </form>
      )}

      {showAssign && isAdmin && (
        <form onSubmit={addAssignment} className="mb-4 rounded-2xl border p-4 space-y-3" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select required value={aForm.student_id} onChange={(e) => setAForm({ ...aForm, student_id: e.target.value })} className="rounded-xl border px-3.5 py-2 text-[13px] outline-none" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <option value="">— Student —</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
            <select required value={aForm.route_id} onChange={(e) => setAForm({ ...aForm, route_id: e.target.value })} className="rounded-xl border px-3.5 py-2 text-[13px] outline-none" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <option value="">— Route —</option>
              {routes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <select value={aForm.vehicle_id} onChange={(e) => setAForm({ ...aForm, vehicle_id: e.target.value })} className="rounded-xl border px-3.5 py-2 text-[13px] outline-none" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <option value="">— Vehicle (optional) —</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registration_no}</option>)}
            </select>
          </div>
          {err && <div className="text-[12px] text-rose-600">{err}</div>}
          <button type="submit" disabled={saving} className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-2 text-[13px] font-semibold text-white disabled:opacity-50">{saving ? "..." : "Assign"}</button>
        </form>
      )}

      <div className="flex gap-1 rounded-full border p-1 mb-4 text-[12px] w-fit" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
        {[{ k: "routes" as const, l: "🛣️ Routes" }, { k: "vehicles" as const, l: "🚌 Vehicles" }, { k: "assignments" as const, l: "👥 Students" }].map((t) => (
          <button key={t.k} onClick={() => setView(t.k)}
            className={"rounded-full px-3 py-1.5 font-medium whitespace-nowrap " + (view === t.k ? "bg-[var(--text)] text-[var(--bg)]" : "")}
            style={view !== t.k ? { color: "var(--text-muted)" } : {}}>{t.l}</button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-[13px]" style={{ color: "var(--text-muted)" }}>Loading...</div>
      ) : view === "routes" ? (
        routes.length === 0 ? <Empty e="🛣️" t="No routes yet" /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {routes.map((r) => (
              <div key={r.id} className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <div className="text-[14px] font-semibold">{r.name}</div>
                {r.route_code && <div className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>{r.route_code}</div>}
                <div className="text-[12px] mt-2" style={{ color: "var(--text-muted)" }}>
                  {r.start_point} → {r.end_point}
                </div>
                <div className="mt-2 flex gap-3 text-[11px]" style={{ color: "var(--text-muted)" }}>
                  <span>👥 {r.capacity}</span>
                  <span>৳{r.monthly_fee}/mo</span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : view === "vehicles" ? (
        vehicles.length === 0 ? <Empty e="🚌" t="No vehicles yet" /> : (
          <div className="space-y-2">
            {vehicles.map((v) => (
              <div key={v.id} className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold font-mono">{v.registration_no}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {v.model || "—"} · {v.transport_routes?.name || "No route"}
                    </div>
                    {v.driver_name && (
                      <div className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
                        🧑‍✈️ {v.driver_name} {v.driver_phone && "· 📞 " + v.driver_phone}
                      </div>
                    )}
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    💺 {v.capacity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        assignments.length === 0 ? <Empty e="👥" t="No student assignments yet" /> : (
          <div className="space-y-2">
            {assignments.map((a) => (
              <div key={a.id} className="rounded-2xl border p-3 flex items-center gap-3" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <div className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold text-white" style={{ background: "linear-gradient(135deg,#10b981,#14b8a6)" }}>
                  {a.students?.full_name?.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold truncate">{a.students?.full_name}</div>
                  <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {a.students?.student_id} · {a.transport_routes?.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
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
