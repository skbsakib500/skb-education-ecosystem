"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const PLATFORMS = [
  { v: "zoom", l: "Zoom", e: "📹" },
  { v: "google_meet", l: "Google Meet", e: "🟢" },
  { v: "teams", l: "MS Teams", e: "🔵" },
  { v: "jitsi", l: "Jitsi", e: "🟣" },
  { v: "youtube", l: "YouTube Live", e: "🔴" },
  { v: "custom", l: "Custom", e: "🔗" },
];

export default function LiveClassesTab({ institutionId, isAdmin }: { institutionId: string; isAdmin: boolean }) {
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    class_id: "", subject_id: "", title: "", platform: "zoom", join_url: "",
    meeting_id: "", passcode: "", scheduled_at: new Date(Date.now() + 3600e3).toISOString().slice(0, 16),
    duration_minutes: 60,
  });

  const load = async () => {
    setLoading(true);
    const [c, s, l] = await Promise.all([
      supabase.from("classes").select("*").eq("institution_id", institutionId).order("name"),
      supabase.from("subjects").select("*").eq("institution_id", institutionId).order("name"),
      supabase.from("live_classes").select("*, classes:class_id(name, section), subjects:subject_id(name)").eq("institution_id", institutionId).order("scheduled_at", { ascending: false }).limit(50),
    ]);
    setClasses(c.data ?? []);
    setSubjects(s.data ?? []);
    setItems(l.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [institutionId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.class_id || !form.title.trim() || !form.join_url.trim()) { setErr("Class + Title + URL"); return; }
    setSaving(true); setErr("");
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("live_classes").insert({
      institution_id: institutionId, class_id: form.class_id,
      subject_id: form.subject_id || null, teacher_id: u.user?.id,
      title: form.title.trim(), platform: form.platform, join_url: form.join_url.trim(),
      meeting_id: form.meeting_id.trim() || null, passcode: form.passcode.trim() || null,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      duration_minutes: form.duration_minutes,
    });
    setSaving(false);
    if (error) { setErr(error.message); return; }

    // Notify students
    const { data: st } = await supabase.from("students").select("linked_user_id").eq("institution_id", institutionId).eq("class_id", form.class_id);
    if (st && st.length > 0) {
      const notifs = st.filter((s: any) => s.linked_user_id).map((s: any) => ({
        institution_id: institutionId, recipient_user_id: s.linked_user_id,
        title: "📹 New live class scheduled", body: form.title + " at " + new Date(form.scheduled_at).toLocaleString(),
        category: "general",
      }));
      if (notifs.length > 0) await supabase.from("notifications").insert(notifs);
    }

    setForm({ class_id: "", subject_id: "", title: "", platform: "zoom", join_url: "", meeting_id: "", passcode: "", scheduled_at: new Date(Date.now() + 3600e3).toISOString().slice(0, 16), duration_minutes: 60 });
    setShowForm(false);
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this class?")) return;
    await supabase.from("live_classes").delete().eq("id", id);
    await load();
  };

  const setStatus = async (id: string, status: string) => {
    await supabase.from("live_classes").update({ status }).eq("id", id);
    await load();
  };

  const now = new Date();
  const upcoming = items.filter((i) => new Date(i.scheduled_at) >= now).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  const past = items.filter((i) => new Date(i.scheduled_at) < now);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-[16px] font-semibold">Live Classes · <span className="bangla font-normal">লাইভ ক্লাস</span></h2>
        {(isAdmin) && (
          <button onClick={() => setShowForm(!showForm)}
            className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow">
            {showForm ? "Cancel" : "+ Schedule"}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={submit} className="mb-4 rounded-2xl border p-4 space-y-3" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select required value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })}
              className="rounded-xl border px-3.5 py-2 text-[13px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <option value="">— Class * —</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}{c.section ? " · " + c.section : ""}</option>)}
            </select>
            <select value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
              className="rounded-xl border px-3.5 py-2 text-[13px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <option value="">— Subject —</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Class title *" className="rounded-xl border px-3.5 py-2 text-[13px] outline-none sm:col-span-2"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}
              className="rounded-xl border px-3.5 py-2 text-[13px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              {PLATFORMS.map((p) => <option key={p.v} value={p.v}>{p.e} {p.l}</option>)}
            </select>
            <input type="datetime-local" required value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
              className="rounded-xl border px-3.5 py-2 text-[13px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <input type="url" required value={form.join_url} onChange={(e) => setForm({ ...form, join_url: e.target.value })}
              placeholder="https://zoom.us/j/... *" className="rounded-xl border px-3.5 py-2 text-[13px] outline-none sm:col-span-2 font-mono"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <input type="text" value={form.meeting_id} onChange={(e) => setForm({ ...form, meeting_id: e.target.value })}
              placeholder="Meeting ID (optional)" className="rounded-xl border px-3.5 py-2 text-[13px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <input type="text" value={form.passcode} onChange={(e) => setForm({ ...form, passcode: e.target.value })}
              placeholder="Passcode (optional)" className="rounded-xl border px-3.5 py-2 text-[13px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <div>
              <label className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>Duration (min)</label>
              <input type="number" min="15" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 60 })}
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[13px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>
          </div>
          {err && <div className="text-[12px] text-rose-600">{err}</div>}
          <button type="submit" disabled={saving}
            className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-2 text-[13px] font-semibold text-white disabled:opacity-50">
            {saving ? "..." : "📅 Schedule & Notify"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-10 text-[13px]" style={{ color: "var(--text-muted)" }}>Loading...</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="text-[36px]">📹</div>
          <div className="mt-2 text-[14px] font-semibold">No live classes yet</div>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="mb-6">
              <div className="text-[12px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Upcoming ({upcoming.length})</div>
              <div className="space-y-2">
                {upcoming.map((l) => <LiveRow key={l.id} l={l} isAdmin={isAdmin} onRemove={() => remove(l.id)} onStatus={(s) => setStatus(l.id, s)} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <div className="text-[12px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-faint)" }}>Past ({past.length})</div>
              <div className="space-y-2 opacity-70">
                {past.slice(0, 10).map((l) => <LiveRow key={l.id} l={l} isAdmin={false} onRemove={() => remove(l.id)} onStatus={() => {}} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function LiveRow({ l, isAdmin, onRemove, onStatus }: any) {
  const p = PLATFORMS.find((x) => x.v === l.platform) ?? PLATFORMS[0];
  const startsIn = new Date(l.scheduled_at).getTime() - Date.now();
  const isLive = startsIn <= 0 && startsIn > -l.duration_minutes * 60e3;
  return (
    <div className={"rounded-2xl border p-4 " + (isLive ? "border-rose-500/40 bg-rose-500/5" : "")} style={!isLive ? { borderColor: "var(--border)", background: "var(--surface-3)" } : {}}>
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl text-[22px] shrink-0" style={{ background: "linear-gradient(135deg,#10b98120,#14b8a620)" }}>
          {p.e}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-[14px] font-semibold">{l.title}</div>
            {isLive && <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white animate-pulse">● LIVE</span>}
            <span className="rounded-full bg-[var(--bg-soft)] px-2 py-0.5 text-[10px] font-medium capitalize">{l.status}</span>
          </div>
          <div className="flex flex-wrap gap-3 mt-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
            <span>📚 {l.classes?.name}{l.classes?.section ? " · " + l.classes.section : ""}</span>
            {l.subjects?.name && <span>{l.subjects.name}</span>}
            <span>📅 {new Date(l.scheduled_at).toLocaleString()}</span>
            <span>⏱ {l.duration_minutes}min</span>
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <a href={l.join_url} target="_blank" rel="noopener noreferrer"
            className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-1.5 text-[11px] font-semibold text-white shadow">
            🎥 Join
          </a>
          {isAdmin && (
            <>
              {l.status === "scheduled" && <button onClick={() => onStatus("completed")} className="rounded-full border px-2 py-1 text-[10px]" style={{ borderColor: "var(--border)" }}>✓</button>}
              <button onClick={onRemove} className="rounded-full px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-500/10">✕</button>
            </>
          )}
        </div>
      </div>
      {(l.meeting_id || l.passcode) && (
        <div className="mt-3 pt-3 border-t flex flex-wrap gap-3 text-[11px] font-mono" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
          {l.meeting_id && <span>ID: {l.meeting_id}</span>}
          {l.passcode && <span>Passcode: {l.passcode}</span>}
        </div>
      )}
    </div>
  );
}
