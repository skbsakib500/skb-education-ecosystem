"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const TYPES = [
  { value: "general",   label: "General",   emoji: "📅" },
  { value: "govt",      label: "Govt",      emoji: "🏛️" },
  { value: "religious", label: "Religious", emoji: "🕌" },
  { value: "exam",      label: "Exam",      emoji: "📝" },
  { value: "event",     label: "Event",     emoji: "🎪" },
  { value: "vacation",  label: "Vacation",  emoji: "🏖️" },
];

export default function HolidaysTab({ institutionId, isAdmin }: { institutionId: string; isAdmin: boolean }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({
    name: "", name_bn: "", start_date: new Date().toISOString().slice(0, 10),
    end_date: "", type: "general", description: "",
  });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("holidays").select("*")
      .eq("institution_id", institutionId)
      .order("start_date", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [institutionId]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setErr("");
    const { error } = await supabase.from("holidays").insert({
      institution_id: institutionId,
      name: form.name.trim(),
      name_bn: form.name_bn.trim() || null,
      start_date: form.start_date,
      end_date: form.end_date || null,
      type: form.type,
      description: form.description.trim() || null,
    });
    setSaving(false);
    if (error) { setErr(error.message); return; }
    setForm({ name: "", name_bn: "", start_date: new Date().toISOString().slice(0, 10), end_date: "", type: "general", description: "" });
    setShowForm(false); await load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete holiday?")) return;
    await supabase.from("holidays").delete().eq("id", id);
    await load();
  };

  const isUpcoming = (h: any) => new Date(h.start_date) >= new Date(new Date().toDateString());
  const upcoming = items.filter(isUpcoming).sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  const past = items.filter((h) => !isUpcoming(h));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[16px] font-semibold">Holidays · <span className="bangla font-normal">ছুটির তালিকা</span></h2>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)}
            className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow">
            {showForm ? "Cancel" : "+ Add Holiday"}
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <form onSubmit={add} className="mb-4 rounded-2xl border p-4 space-y-3"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Holiday Name *</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Eid-ul-Fitr"
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Name (বাংলা)</label>
              <input type="text" value={form.name_bn} onChange={(e) => setForm({ ...form, name_bn: e.target.value })}
                placeholder="ঈদুল ফিতর"
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none bangla"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Start Date *</label>
              <input type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>End Date</label>
              <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Type</label>
              <div className="mt-1 flex flex-wrap gap-2">
                {TYPES.map((t) => (
                  <button key={t.value} type="button" onClick={() => setForm({ ...form, type: t.value })}
                    className={"rounded-full border px-3 py-1.5 text-[12px] font-medium transition " + (form.type === t.value ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700" : "")}
                    style={form.type !== t.value ? { borderColor: "var(--border)", background: "var(--surface-3)" } : {}}>
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {err && <div className="text-[12px] text-rose-600">{err}</div>}
          <button type="submit" disabled={saving}
            className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-2 text-[13px] font-semibold text-white disabled:opacity-50">
            {saving ? "Saving..." : "Save Holiday"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-10 text-[13px]" style={{ color: "var(--text-muted)" }}>Loading...</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="text-[36px]">🎉</div>
          <div className="mt-2 text-[14px] font-semibold">No holidays yet</div>
          <div className="bangla text-[12px]" style={{ color: "var(--text-muted)" }}>প্রথম holiday যোগ করুন</div>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="mb-6">
              <div className="text-[12px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
                Upcoming ({upcoming.length})
              </div>
              <div className="space-y-2">
                {upcoming.map((h) => <HolidayRow key={h.id} h={h} isAdmin={isAdmin} onDelete={() => remove(h.id)} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <div className="text-[12px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-faint)" }}>
                Past ({past.length})
              </div>
              <div className="space-y-2 opacity-70">
                {past.slice(0, 10).map((h) => <HolidayRow key={h.id} h={h} isAdmin={false} onDelete={() => remove(h.id)} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function HolidayRow({ h, isAdmin, onDelete }: any) {
  const t = TYPES.find((x) => x.value === h.type) ?? TYPES[0];
  return (
    <div className="rounded-2xl border p-3 flex items-center gap-3"
      style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
      <div className="text-[22px]">{t.emoji}</div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold">{h.name}</div>
        {h.name_bn && <div className="bangla text-[11px]" style={{ color: "var(--text-muted)" }}>{h.name_bn}</div>}
        <div className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
          📅 {new Date(h.start_date).toLocaleDateString()}
          {h.end_date && ` → ${new Date(h.end_date).toLocaleDateString()}`}
        </div>
      </div>
      {isAdmin && (
        <button onClick={onDelete}
          className="rounded-full px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-500/10">✕</button>
      )}
    </div>
  );
}
