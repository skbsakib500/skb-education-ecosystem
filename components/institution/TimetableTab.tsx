"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function TimetableTab({ institutionId, isAdmin }: { institutionId: string; isAdmin: boolean }) {
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    subject_id: "", day_of_week: 0, start_time: "09:00", end_time: "10:00", room: "",
  });

  const load = async () => {
    setLoading(true);
    const [cRes, sRes] = await Promise.all([
      supabase.from("classes").select("*").eq("institution_id", institutionId).order("name"),
      supabase.from("subjects").select("*").eq("institution_id", institutionId).order("name"),
    ]);
    setClasses(cRes.data ?? []);
    setSubjects(sRes.data ?? []);
    if (cRes.data && cRes.data.length > 0 && !selectedClass) setSelectedClass(cRes.data[0].id);
    setLoading(false);
  };
  useEffect(() => { load(); }, [institutionId]);

  useEffect(() => {
    if (!selectedClass) return;
    (async () => {
      const { data } = await supabase.from("timetable_slots")
        .select("*, subjects:subject_id(name, code)")
        .eq("class_id", selectedClass)
        .order("day_of_week").order("start_time");
      setSlots(data ?? []);
    })();
  }, [selectedClass]);

  const addSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !form.subject_id) return;
    setSaving(true); setErr("");
    const { error } = await supabase.from("timetable_slots").insert({
      institution_id: institutionId, class_id: selectedClass,
      subject_id: form.subject_id, day_of_week: form.day_of_week,
      start_time: form.start_time, end_time: form.end_time,
      room: form.room.trim() || null,
    });
    if (error) { setErr(error.message); setSaving(false); return; }
    setForm({ subject_id: "", day_of_week: 0, start_time: "09:00", end_time: "10:00", room: "" });
    setShowForm(false); setSaving(false);
    const { data } = await supabase.from("timetable_slots")
      .select("*, subjects:subject_id(name, code)").eq("class_id", selectedClass)
      .order("day_of_week").order("start_time");
    setSlots(data ?? []);
  };

  const removeSlot = async (id: string) => {
    if (!confirm("Remove this slot?")) return;
    await supabase.from("timetable_slots").delete().eq("id", id);
    const { data } = await supabase.from("timetable_slots")
      .select("*, subjects:subject_id(name, code)").eq("class_id", selectedClass)
      .order("day_of_week").order("start_time");
    setSlots(data ?? []);
  };

  const slotsByDay = (day: number) => slots.filter((s) => s.day_of_week === day)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  if (loading) return <div className="text-center py-10 text-[13px]" style={{ color: "var(--text-muted)" }}>Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-[16px] font-semibold">Timetable · <span className="bangla font-normal">সময়সূচি</span></h2>
        <div className="flex gap-2">
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
            className="rounded-full border px-3 py-1.5 text-[12px] outline-none"
            style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}{c.section ? " · " + c.section : ""}</option>)}
          </select>
          {isAdmin && (
            <button onClick={() => setShowForm(!showForm)}
              className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow">
              {showForm ? "Cancel" : "+ Add Slot"}
            </button>
          )}
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="text-[36px]">🕐</div>
          <div className="mt-2 text-[14px] font-semibold">Add a class first</div>
          <div className="bangla text-[12px]" style={{ color: "var(--text-muted)" }}>Classes tab থেকে class যোগ করুন</div>
        </div>
      ) : subjects.length === 0 && isAdmin ? (
        <div className="rounded-2xl border p-10 text-center"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="text-[36px]">📖</div>
          <div className="mt-2 text-[14px] font-semibold">Add subjects first</div>
          <div className="bangla text-[12px]" style={{ color: "var(--text-muted)" }}>Settings → Subjects থেকে subject যোগ করুন</div>
        </div>
      ) : (
        <>
          {showForm && isAdmin && (
            <form onSubmit={addSlot} className="mb-4 rounded-2xl border p-4 space-y-3"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Subject *</label>
                  <select required value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                    className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                    style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                    <option value="">— Select —</option>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}{s.code ? " · " + s.code : ""}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Day</label>
                  <select value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: parseInt(e.target.value) })}
                    className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                    style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                    {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Start</label>
                  <input type="time" required value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                    style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
                </div>
                <div>
                  <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>End</label>
                  <input type="time" required value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                    style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Room (optional)</label>
                  <input type="text" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })}
                    placeholder="Room 204"
                    className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                    style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
                </div>
              </div>
              {err && <div className="text-[12px] text-rose-600">{err}</div>}
              <button type="submit" disabled={saving}
                className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-2 text-[13px] font-semibold text-white disabled:opacity-50">
                {saving ? "Saving..." : "Add to Timetable"}
              </button>
            </form>
          )}

          {/* Timetable Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {DAYS.map((day, i) => {
              const daySlots = slotsByDay(i);
              return (
                <div key={i} className="rounded-2xl border overflow-hidden"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                  <div className="px-4 py-2.5 border-b flex items-center justify-between"
                    style={{ borderColor: "var(--border)", background: "var(--bg-soft)" }}>
                    <div className="text-[13px] font-semibold">{day}</div>
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      {daySlots.length}
                    </span>
                  </div>
                  {daySlots.length === 0 ? (
                    <div className="p-4 text-center text-[11px]" style={{ color: "var(--text-faint)" }}>No classes</div>
                  ) : (
                    <div className="p-2 space-y-1.5">
                      {daySlots.map((s) => (
                        <div key={s.id} className="rounded-xl border p-2.5 group"
                          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="text-[12px] font-semibold truncate">{s.subjects?.name}</div>
                              <div className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                                {String(s.start_time).slice(0, 5)}–{String(s.end_time).slice(0, 5)}
                                {s.room && <> · {s.room}</>}
                              </div>
                            </div>
                            {isAdmin && (
                              <button onClick={() => removeSlot(s.id)}
                                className="opacity-0 group-hover:opacity-100 rounded-full px-1.5 text-[10px] text-rose-600">✕</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
