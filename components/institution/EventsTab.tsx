"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const TYPES = [
  { v: "general",   l: "General",   e: "📅" },
  { v: "exam",      l: "Exam",      e: "📝" },
  { v: "holiday",   l: "Holiday",   e: "🎉" },
  { v: "sports",    l: "Sports",    e: "🏆" },
  { v: "cultural",  l: "Cultural",  e: "🎭" },
  { v: "meeting",   l: "Meeting",   e: "👥" },
  { v: "ptm",       l: "PTM",       e: "👪" },
  { v: "result",    l: "Result Day",e: "📊" },
];

export default function EventsTab({ institutionId, isAdmin }: { institutionId: string; isAdmin: boolean }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({
    title: "", title_bn: "", description: "", event_type: "general",
    start_at: new Date().toISOString().slice(0, 16),
    end_at: "", venue: "", cover_url: "", is_public: true,
  });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("events").select("*")
      .eq("institution_id", institutionId)
      .order("start_at", { ascending: false });
    setEvents(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [institutionId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setErr("");
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("events").insert({
      institution_id: institutionId,
      title: form.title.trim(), title_bn: form.title_bn.trim() || null,
      description: form.description.trim() || null,
      event_type: form.event_type,
      start_at: new Date(form.start_at).toISOString(),
      end_at: form.end_at ? new Date(form.end_at).toISOString() : null,
      venue: form.venue.trim() || null, cover_url: form.cover_url.trim() || null,
      is_public: form.is_public, created_by: u.user?.id,
    });
    setSaving(false);
    if (error) { setErr(error.message); return; }
    setForm({ title: "", title_bn: "", description: "", event_type: "general", start_at: new Date().toISOString().slice(0, 16), end_at: "", venue: "", cover_url: "", is_public: true });
    setShowForm(false); await load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete event?")) return;
    await supabase.from("events").delete().eq("id", id);
    await load();
  };

  const now = new Date();
  const upcoming = events.filter((e) => new Date(e.start_at) >= now).sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  const past = events.filter((e) => new Date(e.start_at) < now);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[16px] font-semibold">Events · <span className="bangla font-normal">ইভেন্ট</span></h2>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)}
            className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow">
            {showForm ? "Cancel" : "+ New Event"}
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <form onSubmit={submit} className="mb-4 rounded-2xl border p-4 space-y-3"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Event title *"
              className="rounded-xl border px-3.5 py-2 text-[13px] outline-none sm:col-span-2"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <input type="text" value={form.title_bn} onChange={(e) => setForm({ ...form, title_bn: e.target.value })}
              placeholder="শিরোনাম (বাংলা)"
              className="rounded-xl border px-3.5 py-2 text-[13px] outline-none bangla"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <select value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })}
              className="rounded-xl border px-3.5 py-2 text-[13px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              {TYPES.map((t) => <option key={t.v} value={t.v}>{t.e} {t.l}</option>)}
            </select>
            <input type="datetime-local" required value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })}
              className="rounded-xl border px-3.5 py-2 text-[13px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <input type="datetime-local" value={form.end_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })}
              className="rounded-xl border px-3.5 py-2 text-[13px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <input type="text" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })}
              placeholder="Venue"
              className="rounded-xl border px-3.5 py-2 text-[13px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <input type="text" value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
              placeholder="Cover image URL"
              className="rounded-xl border px-3.5 py-2 text-[13px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
          </div>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2} placeholder="Description..."
            className="w-full rounded-xl border px-3.5 py-2 text-[13px] outline-none resize-none"
            style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
          <label className="flex items-center gap-2 text-[12px]">
            <input type="checkbox" checked={form.is_public} onChange={(e) => setForm({ ...form, is_public: e.target.checked })} className="accent-emerald-500" />
            🌐 Public event
          </label>
          {err && <div className="text-[12px] text-rose-600">{err}</div>}
          <button type="submit" disabled={saving}
            className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-2 text-[13px] font-semibold text-white disabled:opacity-50">
            {saving ? "..." : "Save Event"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-10 text-[13px]" style={{ color: "var(--text-muted)" }}>Loading...</div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="text-[36px]">📅</div>
          <div className="mt-2 text-[14px] font-semibold">No events yet</div>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="mb-6">
              <div className="text-[12px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Upcoming ({upcoming.length})</div>
              <div className="space-y-2">
                {upcoming.map((e) => <EventRow key={e.id} e={e} onDelete={() => remove(e.id)} isAdmin={isAdmin} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <div className="text-[12px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-faint)" }}>Past ({past.length})</div>
              <div className="space-y-2 opacity-70">
                {past.slice(0, 10).map((e) => <EventRow key={e.id} e={e} onDelete={() => remove(e.id)} isAdmin={false} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EventRow({ e, onDelete, isAdmin }: any) {
  const t = TYPES.find((x) => x.v === e.event_type) ?? TYPES[0];
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
      {e.cover_url && <div className="h-32 bg-cover bg-center" style={{ backgroundImage: "url(" + e.cover_url + ")" }} />}
      <div className="p-4 flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl text-[22px] shrink-0"
          style={{ background: "linear-gradient(135deg,#10b98120,#14b8a620)" }}>{t.e}</div>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold">{e.title}</div>
          {e.title_bn && <div className="bangla text-[12px]" style={{ color: "var(--text-muted)" }}>{e.title_bn}</div>}
          <div className="flex flex-wrap gap-3 mt-2 text-[11px]" style={{ color: "var(--text-muted)" }}>
            <span>📅 {new Date(e.start_at).toLocaleString()}</span>
            {e.venue && <span>📍 {e.venue}</span>}
            <span className="capitalize">{e.event_type}</span>
          </div>
          {e.description && <div className="mt-2 text-[12px]" style={{ color: "var(--text-muted)" }}>{e.description}</div>}
        </div>
        {isAdmin && (
          <button onClick={onDelete} className="shrink-0 rounded-full px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-500/10">✕</button>
        )}
      </div>
    </div>
  );
}
