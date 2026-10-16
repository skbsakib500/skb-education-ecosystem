"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CommunicationTab({ institutionId, isAdmin }: { institutionId: string; isAdmin: boolean }) {
  const [view, setView] = useState<"compose"|"history">("compose");
  const [classes, setClasses] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [form, setForm] = useState({
    subject: "",
    body: "",
    audience: "parents" as "all"|"teachers"|"students"|"parents"|"class",
    class_id: "",
  });

  const load = async () => {
    setLoading(true);
    const [cRes, hRes] = await Promise.all([
      supabase.from("classes").select("*").eq("institution_id", institutionId).order("name"),
      supabase.from("broadcasts").select("*").eq("institution_id", institutionId).order("created_at", { ascending: false }).limit(50),
    ]);
    setClasses(cRes.data ?? []);
    setHistory(hRes.data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [institutionId]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.body.trim()) return;
    if (form.audience === "class" && !form.class_id) {
      setErr("Class select করুন"); return;
    }
    setSending(true); setErr(""); setOk("");
    const { data, error } = await supabase.rpc("send_broadcast", {
      p_institution_id: institutionId,
      p_subject: form.subject.trim(),
      p_body: form.body.trim(),
      p_audience: form.audience,
      p_class_id: form.class_id || null,
      p_channel: "in_app",
    });
    setSending(false);
    if (error) { setErr(error.message); return; }
    const count = (data as any)?.recipients_count ?? 0;
    setOk("✅ Sent to " + count + " recipient(s)");
    setForm({ subject: "", body: "", audience: "parents", class_id: "" });
    await load();
    setTimeout(() => setOk(""), 3000);
  };

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border p-10 text-center"
        style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
        <div className="text-[36px]">🔒</div>
        <div className="mt-2 text-[14px] font-semibold">Admin access required</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-[16px] font-semibold">Communication · <span className="bangla font-normal">যোগাযোগ</span></h2>
        <div className="flex gap-1 rounded-full border p-1 text-[12px]"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <button onClick={() => setView("compose")}
            className={"rounded-full px-3 py-1 font-medium " + (view === "compose" ? "bg-[var(--text)] text-[var(--bg)]" : "")}
            style={view !== "compose" ? { color: "var(--text-muted)" } : {}}>✉️ Compose</button>
          <button onClick={() => setView("history")}
            className={"rounded-full px-3 py-1 font-medium " + (view === "history" ? "bg-[var(--text)] text-[var(--bg)]" : "")}
            style={view !== "history" ? { color: "var(--text-muted)" } : {}}>📜 History</button>
        </div>
      </div>

      {view === "compose" ? (
        <form onSubmit={send} className="rounded-2xl border p-5 space-y-4"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Audience *</label>
              <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value as any })}
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <option value="all">🌐 Everyone</option>
                <option value="teachers">👨‍🏫 Teachers only</option>
                <option value="students">👥 Students only</option>
                <option value="parents">👪 Parents only</option>
                <option value="class">📚 Specific Class</option>
              </select>
            </div>
            {form.audience === "class" && (
              <div>
                <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Class *</label>
                <select value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                  className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                  <option value="">— Select class —</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}{c.section ? " · " + c.section : ""}</option>)}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Subject *</label>
            <input type="text" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Annual Sports Day · Exam Schedule · Fee Reminder"
              className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
          </div>

          <div>
            <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Message *</label>
            <textarea required value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={6} placeholder="বিস্তারিত লিখুন..."
              className="mt-1 w-full rounded-xl border px-3.5 py-2.5 text-[14px] outline-none resize-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
          </div>

          <div className="rounded-xl p-3 text-[11px]" style={{ background: "var(--bg-soft)", color: "var(--text-muted)" }}>
            💡 In-app notification হিসেবে পাঠানো হবে। Email/SMS integration ভবিষ্যতে।
          </div>

          {err && <div className="text-[12px] text-rose-600">{err}</div>}
          {ok && <div className="text-[12px] text-emerald-600 font-medium">{ok}</div>}

          <button type="submit" disabled={sending}
            className="w-full rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 py-3 text-[14px] font-semibold text-white shadow disabled:opacity-50">
            {sending ? "Sending..." : "📤 Send Broadcast"}
          </button>
        </form>
      ) : (
        <div>
          {loading ? (
            <div className="text-center py-10 text-[13px]" style={{ color: "var(--text-muted)" }}>Loading...</div>
          ) : history.length === 0 ? (
            <div className="rounded-2xl border p-10 text-center"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <div className="text-[36px]">📜</div>
              <div className="mt-2 text-[14px] font-semibold">No broadcasts sent yet</div>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((h) => (
                <div key={h.id} className="rounded-2xl border p-4"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-semibold">{h.subject}</div>
                      <div className="text-[12px] mt-1 line-clamp-2" style={{ color: "var(--text-muted)" }}>{h.body}</div>
                      <div className="flex flex-wrap gap-2 mt-2 text-[10px]">
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-700 font-medium">
                          👥 {h.audience}
                        </span>
                        <span className="rounded-full bg-[var(--bg-soft)] px-2 py-0.5 font-medium">
                          {h.recipients_count} sent
                        </span>
                        <span className="rounded-full bg-[var(--bg-soft)] px-2 py-0.5 font-medium capitalize">
                          {h.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-[10px] whitespace-nowrap" style={{ color: "var(--text-faint)" }}>
                      {new Date(h.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
