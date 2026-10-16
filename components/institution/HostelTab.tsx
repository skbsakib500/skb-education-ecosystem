"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function HostelTab({ institutionId, isAdmin }: { institutionId: string; isAdmin: boolean }) {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"blocks"|"rooms"|"allocations">("blocks");
  const [showBlock, setShowBlock] = useState(false);
  const [showRoom, setShowRoom] = useState(false);
  const [showAlloc, setShowAlloc] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [bForm, setBForm] = useState({ name: "", gender: "mixed", warden_name: "", warden_phone: "" });
  const [rmForm, setRmForm] = useState({ block_id: "", room_no: "", floor: 0, capacity: 4, monthly_fee: 0, room_type: "shared" });
  const [aForm, setAForm] = useState({ student_id: "", room_id: "" });

  const load = async () => {
    setLoading(true);
    const [bRes, rRes, aRes, sRes, stRes] = await Promise.all([
      supabase.from("hostel_blocks").select("*").eq("institution_id", institutionId).order("name"),
      supabase.from("hostel_rooms").select("*, hostel_blocks:block_id(name)").order("room_no"),
      supabase.from("hostel_allocations").select("*, students:student_id(full_name, student_id), hostel_rooms:room_id(room_no, hostel_blocks:block_id(name))").eq("institution_id", institutionId).eq("is_active", true),
      supabase.from("students").select("id, full_name, student_id").eq("institution_id", institutionId).order("full_name"),
      supabase.rpc("hostel_stats", { p_institution_id: institutionId }),
    ]);
    setBlocks(bRes.data ?? []);
    const blockIds = (bRes.data ?? []).map((b: any) => b.id);
    setRooms((rRes.data ?? []).filter((r: any) => blockIds.includes(r.block_id)));
    setAllocations(aRes.data ?? []);
    setStudents(sRes.data ?? []);
    setStats(stRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [institutionId]);

  const addBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setErr("");
    const { error } = await supabase.from("hostel_blocks").insert({
      institution_id: institutionId, name: bForm.name.trim(), gender: bForm.gender,
      warden_name: bForm.warden_name.trim() || null, warden_phone: bForm.warden_phone.trim() || null,
    });
    setSaving(false);
    if (error) { setErr(error.message); return; }
    setBForm({ name: "", gender: "mixed", warden_name: "", warden_phone: "" });
    setShowBlock(false); await load();
  };

  const addRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rmForm.block_id) { setErr("Block select করুন"); return; }
    setSaving(true); setErr("");
    const { error } = await supabase.from("hostel_rooms").insert({
      block_id: rmForm.block_id, room_no: rmForm.room_no.trim(),
      floor: rmForm.floor, capacity: rmForm.capacity,
      monthly_fee: rmForm.monthly_fee, room_type: rmForm.room_type,
    });
    setSaving(false);
    if (error) { setErr(error.message); return; }
    setRmForm({ block_id: "", room_no: "", floor: 0, capacity: 4, monthly_fee: 0, room_type: "shared" });
    setShowRoom(false); await load();
  };

  const addAlloc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aForm.student_id || !aForm.room_id) { setErr("Student + Room"); return; }
    setSaving(true); setErr("");
    const { error } = await supabase.from("hostel_allocations").insert({
      institution_id: institutionId, student_id: aForm.student_id, room_id: aForm.room_id,
    });
    setSaving(false);
    if (error) { setErr(error.message); return; }
    setAForm({ student_id: "", room_id: "" });
    setShowAlloc(false); await load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-[16px] font-semibold">Hostel · <span className="bangla font-normal">হোস্টেল</span></h2>
        {isAdmin && (
          <div className="flex gap-2">
            {view === "blocks" && <button onClick={() => setShowBlock(!showBlock)} className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow">{showBlock ? "Cancel" : "+ Block"}</button>}
            {view === "rooms" && <button onClick={() => setShowRoom(!showRoom)} className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow">{showRoom ? "Cancel" : "+ Room"}</button>}
            {view === "allocations" && <button onClick={() => setShowAlloc(!showAlloc)} className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow">{showAlloc ? "Cancel" : "+ Allocate"}</button>}
          </div>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <S emoji="🏛️" v={stats.total_blocks} l="Blocks" />
          <S emoji="🚪" v={stats.total_rooms} l="Rooms" />
          <S emoji="💺" v={stats.total_capacity} l="Capacity" />
          <S emoji="👥" v={stats.occupied} l="Occupied" />
        </div>
      )}

      {showBlock && isAdmin && (
        <form onSubmit={addBlock} className="mb-4 rounded-2xl border p-4 space-y-3" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="text" required value={bForm.name} onChange={(e) => setBForm({ ...bForm, name: e.target.value })} placeholder="Block name *" className="rounded-xl border px-3.5 py-2 text-[13px] outline-none" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <select value={bForm.gender} onChange={(e) => setBForm({ ...bForm, gender: e.target.value })} className="rounded-xl border px-3.5 py-2 text-[13px] outline-none" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <option value="boys">👦 Boys</option>
              <option value="girls">👧 Girls</option>
              <option value="mixed">👥 Mixed</option>
            </select>
            <input type="text" value={bForm.warden_name} onChange={(e) => setBForm({ ...bForm, warden_name: e.target.value })} placeholder="Warden name" className="rounded-xl border px-3.5 py-2 text-[13px] outline-none" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <input type="text" value={bForm.warden_phone} onChange={(e) => setBForm({ ...bForm, warden_phone: e.target.value })} placeholder="Warden phone" className="rounded-xl border px-3.5 py-2 text-[13px] outline-none" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
          </div>
          {err && <div className="text-[12px] text-rose-600">{err}</div>}
          <button type="submit" disabled={saving} className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-2 text-[13px] font-semibold text-white disabled:opacity-50">{saving ? "..." : "Save Block"}</button>
        </form>
      )}

      {showRoom && isAdmin && (
        <form onSubmit={addRoom} className="mb-4 rounded-2xl border p-4 space-y-3" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select required value={rmForm.block_id} onChange={(e) => setRmForm({ ...rmForm, block_id: e.target.value })} className="rounded-xl border px-3.5 py-2 text-[13px] outline-none" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <option value="">— Block * —</option>
              {blocks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <input type="text" required value={rmForm.room_no} onChange={(e) => setRmForm({ ...rmForm, room_no: e.target.value })} placeholder="Room no *" className="rounded-xl border px-3.5 py-2 text-[13px] outline-none" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <input type="number" value={rmForm.floor} onChange={(e) => setRmForm({ ...rmForm, floor: parseInt(e.target.value) || 0 })} placeholder="Floor" className="rounded-xl border px-3.5 py-2 text-[13px] outline-none" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <input type="number" value={rmForm.capacity} onChange={(e) => setRmForm({ ...rmForm, capacity: parseInt(e.target.value) || 4 })} placeholder="Capacity" className="rounded-xl border px-3.5 py-2 text-[13px] outline-none" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <input type="number" value={rmForm.monthly_fee} onChange={(e) => setRmForm({ ...rmForm, monthly_fee: parseInt(e.target.value) || 0 })} placeholder="Monthly fee (৳)" className="rounded-xl border px-3.5 py-2 text-[13px] outline-none" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <select value={rmForm.room_type} onChange={(e) => setRmForm({ ...rmForm, room_type: e.target.value })} className="rounded-xl border px-3.5 py-2 text-[13px] outline-none" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <option value="single">Single</option>
              <option value="double">Double</option>
              <option value="triple">Triple</option>
              <option value="shared">Shared</option>
              <option value="dorm">Dorm</option>
            </select>
          </div>
          {err && <div className="text-[12px] text-rose-600">{err}</div>}
          <button type="submit" disabled={saving} className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-2 text-[13px] font-semibold text-white disabled:opacity-50">{saving ? "..." : "Save Room"}</button>
        </form>
      )}

      {showAlloc && isAdmin && (
        <form onSubmit={addAlloc} className="mb-4 rounded-2xl border p-4 space-y-3" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select required value={aForm.student_id} onChange={(e) => setAForm({ ...aForm, student_id: e.target.value })} className="rounded-xl border px-3.5 py-2 text-[13px] outline-none" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <option value="">— Student —</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
            <select required value={aForm.room_id} onChange={(e) => setAForm({ ...aForm, room_id: e.target.value })} className="rounded-xl border px-3.5 py-2 text-[13px] outline-none" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <option value="">— Room —</option>
              {rooms.filter((r) => r.occupied < r.capacity).map((r) => <option key={r.id} value={r.id}>{r.hostel_blocks?.name} · {r.room_no} ({r.occupied}/{r.capacity})</option>)}
            </select>
          </div>
          {err && <div className="text-[12px] text-rose-600">{err}</div>}
          <button type="submit" disabled={saving} className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-2 text-[13px] font-semibold text-white disabled:opacity-50">{saving ? "..." : "Allocate"}</button>
        </form>
      )}

      <div className="flex gap-1 rounded-full border p-1 mb-4 text-[12px] w-fit" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
        {[{ k: "blocks" as const, l: "🏛️ Blocks" }, { k: "rooms" as const, l: "🚪 Rooms" }, { k: "allocations" as const, l: "👥 Residents" }].map((t) => (
          <button key={t.k} onClick={() => setView(t.k)}
            className={"rounded-full px-3 py-1.5 font-medium whitespace-nowrap " + (view === t.k ? "bg-[var(--text)] text-[var(--bg)]" : "")}
            style={view !== t.k ? { color: "var(--text-muted)" } : {}}>{t.l}</button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-[13px]" style={{ color: "var(--text-muted)" }}>Loading...</div>
      ) : view === "blocks" ? (
        blocks.length === 0 ? <Empty e="🏛️" t="No hostel blocks" /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {blocks.map((b) => (
              <div key={b.id} className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <div className="text-[14px] font-semibold">{b.name}</div>
                <div className="text-[11px] capitalize mt-0.5" style={{ color: "var(--text-muted)" }}>{b.gender}</div>
                {b.warden_name && <div className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>🧑‍✈️ {b.warden_name} {b.warden_phone && "· 📞 " + b.warden_phone}</div>}
              </div>
            ))}
          </div>
        )
      ) : view === "rooms" ? (
        rooms.length === 0 ? <Empty e="🚪" t="No rooms yet" /> : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {rooms.map((r) => {
              const pct = r.capacity > 0 ? (r.occupied / r.capacity) * 100 : 0;
              return (
                <div key={r.id} className="rounded-2xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                  <div className="flex items-center justify-between">
                    <div className="text-[14px] font-semibold">{r.room_no}</div>
                    <span className={"rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                      (pct >= 100 ? "bg-rose-500/15 text-rose-700" : pct >= 60 ? "bg-amber-500/15 text-amber-700" : "bg-emerald-500/15 text-emerald-700")}>
                      {r.occupied}/{r.capacity}
                    </span>
                  </div>
                  <div className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>{r.hostel_blocks?.name}</div>
                  <div className="text-[10px] capitalize" style={{ color: "var(--text-muted)" }}>{r.room_type}</div>
                  {r.monthly_fee > 0 && <div className="text-[10px] mt-1 font-semibold">৳{r.monthly_fee}/mo</div>}
                </div>
              );
            })}
          </div>
        )
      ) : (
        allocations.length === 0 ? <Empty e="👥" t="No residents yet" /> : (
          <div className="space-y-2">
            {allocations.map((a) => (
              <div key={a.id} className="rounded-2xl border p-3 flex items-center gap-3" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <div className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold text-white" style={{ background: "linear-gradient(135deg,#10b981,#14b8a6)" }}>
                  {a.students?.full_name?.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold truncate">{a.students?.full_name}</div>
                  <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {a.hostel_rooms?.hostel_blocks?.name} · Room {a.hostel_rooms?.room_no}
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
