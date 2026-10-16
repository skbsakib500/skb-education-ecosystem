"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const TYPES = [
  { v: "achievement",    l: "Achievement",    e: "🏆" },
  { v: "completion",     l: "Completion",     e: "✅" },
  { v: "participation",  l: "Participation",  e: "🎖️" },
  { v: "excellence",     l: "Excellence",     e: "⭐" },
  { v: "attendance",     l: "Attendance",     e: "📅" },
  { v: "sports",         l: "Sports",         e: "🏅" },
  { v: "custom",         l: "Custom",         e: "📜" },
];

export default function CertificatesTab({ institutionId, isAdmin }: { institutionId: string; isAdmin: boolean }) {
  const [certs, setCerts] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [viewing, setViewing] = useState<any>(null);

  const [form, setForm] = useState({
    mode: "class" as "class" | "single",
    class_id: "", recipient_name: "", title: "",
    certificate_type: "achievement", description: "",
  });

  const load = async () => {
    setLoading(true);
    const [cRes, c2Res] = await Promise.all([
      supabase.from("certificates").select("*, institutions:institution_id(name, emoji, logo_url, motto)").eq("institution_id", institutionId).order("created_at", { ascending: false }).limit(100),
      supabase.from("classes").select("*").eq("institution_id", institutionId).order("name"),
    ]);
    setCerts(cRes.data ?? []);
    setClasses(c2Res.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [institutionId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setErr(""); setMsg("");

    if (form.mode === "class") {
      if (!form.class_id) { setErr("Class select করুন"); setSaving(false); return; }
      const { data, error } = await supabase.rpc("issue_class_certificates", {
        p_institution_id: institutionId,
        p_class_id: form.class_id,
        p_certificate_type: form.certificate_type,
        p_title: form.title.trim(),
        p_description: form.description.trim() || null,
      });
      setSaving(false);
      if (error) { setErr(error.message); return; }
      setMsg("✅ " + (data as any).issued + " certificates issued!");
    } else {
      if (!form.recipient_name.trim() || !form.title.trim()) { setErr("Name + Title দিন"); setSaving(false); return; }
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("certificates").insert({
        institution_id: institutionId,
        recipient_name: form.recipient_name.trim(),
        certificate_type: form.certificate_type,
        title: form.title.trim(),
        description: form.description.trim() || null,
        issued_by: u.user?.id,
      });
      setSaving(false);
      if (error) { setErr(error.message); return; }
      setMsg("✅ Certificate issued!");
    }

    setForm({ mode: "class", class_id: "", recipient_name: "", title: "", certificate_type: "achievement", description: "" });
    setShowForm(false);
    await load();
    setTimeout(() => setMsg(""), 4000);
  };

  if (!isAdmin) return (
    <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
      <div className="text-[36px]">🔒</div>
      <div className="mt-2 text-[14px] font-semibold">Admin access required</div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[16px] font-semibold">Certificates · <span className="bangla font-normal">সার্টিফিকেট</span></h2>
        <button onClick={() => setShowForm(!showForm)}
          className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow">
          {showForm ? "Cancel" : "+ Issue"}
        </button>
      </div>

      {msg && <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-[13px] text-emerald-700">{msg}</div>}

      {showForm && (
        <form onSubmit={submit} className="mb-4 rounded-2xl border p-4 space-y-3"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="flex gap-2">
            <button type="button" onClick={() => setForm({ ...form, mode: "class" })}
              className={"flex-1 rounded-xl border p-3 text-left " + (form.mode === "class" ? "bg-emerald-500/15 border-emerald-500/40" : "")}
              style={form.mode !== "class" ? { borderColor: "var(--border)" } : {}}>
              <div className="text-[13px] font-semibold">📚 Whole Class</div>
              <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>সব ছাত্রদের একসাথে</div>
            </button>
            <button type="button" onClick={() => setForm({ ...form, mode: "single" })}
              className={"flex-1 rounded-xl border p-3 text-left " + (form.mode === "single" ? "bg-emerald-500/15 border-emerald-500/40" : "")}
              style={form.mode !== "single" ? { borderColor: "var(--border)" } : {}}>
              <div className="text-[13px] font-semibold">👤 Single Person</div>
              <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>একজনকে</div>
            </button>
          </div>

          {form.mode === "class" ? (
            <select required value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })}
              className="w-full rounded-xl border px-3.5 py-2 text-[13px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <option value="">— Class select —</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}{c.section ? " · " + c.section : ""}</option>)}
            </select>
          ) : (
            <input type="text" required value={form.recipient_name}
              onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
              placeholder="Recipient name *"
              className="w-full rounded-xl border px-3.5 py-2 text-[13px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
          )}

          <div className="grid grid-cols-2 gap-3">
            <input type="text" required value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Certificate title * e.g. Annual Sports Champion"
              className="rounded-xl border px-3.5 py-2 text-[13px] outline-none col-span-2"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <select value={form.certificate_type} onChange={(e) => setForm({ ...form, certificate_type: e.target.value })}
              className="rounded-xl border px-3.5 py-2 text-[13px] outline-none col-span-2"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              {TYPES.map((t) => <option key={t.v} value={t.v}>{t.e} {t.l}</option>)}
            </select>
          </div>

          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2} placeholder="Description (optional)"
            className="w-full rounded-xl border px-3.5 py-2 text-[13px] outline-none resize-none"
            style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />

          {err && <div className="text-[12px] text-rose-600">{err}</div>}
          <button type="submit" disabled={saving}
            className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-2 text-[13px] font-semibold text-white disabled:opacity-50">
            {saving ? "..." : "🏆 Issue Certificate"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-10 text-[13px]" style={{ color: "var(--text-muted)" }}>Loading...</div>
      ) : certs.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="text-[36px]">🏆</div>
          <div className="mt-2 text-[14px] font-semibold">No certificates issued</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {certs.map((c) => {
            const t = TYPES.find((x) => x.v === c.certificate_type) ?? TYPES[0];
            return (
              <div key={c.id} className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl text-[22px] shrink-0"
                    style={{ background: "linear-gradient(135deg,#10b98120,#14b8a620)" }}>{t.e}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold truncate">{c.title}</div>
                    <div className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>→ {c.recipient_name}</div>
                    <div className="text-[10px] mt-1 font-mono" style={{ color: "var(--text-faint)" }}>{c.certificate_no}</div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => setViewing(c)}
                    className="flex-1 rounded-full bg-emerald-500/15 py-1.5 text-[11px] font-semibold text-emerald-700">
                    👁 View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewing && <CertificateView cert={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

function CertificateView({ cert, onClose }: { cert: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur p-4 overflow-y-auto">
      <div className="w-full max-w-3xl my-8">
        <div className="flex justify-end mb-3 gap-2">
          <button onClick={() => window.print()}
            className="rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-emerald-700 shadow">🖨️ Print / Save PDF</button>
          <button onClick={onClose} className="rounded-full bg-white/20 backdrop-blur px-4 py-2 text-[13px] font-medium text-white">✕ Close</button>
        </div>

        <div id="cert-print" className="rounded-2xl p-12 md:p-16 text-center bg-white shadow-2xl"
          style={{ borderTop: "20px solid #10b981", borderBottom: "20px solid #10b981" }}>
          <div className="flex justify-center items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl text-[32px]"
              style={{ background: "linear-gradient(135deg,#10b981,#14b8a6)", color: "white" }}>
              {cert.institutions?.emoji || "🏫"}
            </div>
          </div>
          <div className="mt-4 text-[20px] font-bold text-gray-900">{cert.institutions?.name}</div>
          {cert.institutions?.motto && <div className="text-[12px] italic text-gray-600">{cert.institutions.motto}</div>}

          <div className="mt-8 text-[12px] font-bold uppercase tracking-widest text-emerald-700">Certificate of {cert.certificate_type}</div>
          <div className="mt-4 text-[14px] text-gray-600">This certificate is proudly presented to</div>

          <div className="mt-6 text-[36px] font-bold text-gray-900" style={{ fontStyle: "italic" }}>{cert.recipient_name}</div>
          <div className="mt-2 mx-auto h-0.5 w-64 bg-emerald-500" />

          <div className="mt-6 text-[15px] text-gray-800">{cert.title}</div>
          {cert.description && <div className="mt-3 text-[13px] text-gray-600 max-w-xl mx-auto">{cert.description}</div>}

          <div className="mt-12 grid grid-cols-2 gap-8 max-w-md mx-auto">
            <div className="border-t border-gray-400 pt-2 text-[11px] text-gray-500">Class Teacher</div>
            <div className="border-t border-gray-400 pt-2 text-[11px] text-gray-500">Principal</div>
          </div>

          <div className="mt-8 text-[10px] text-gray-400">
            Certificate No: {cert.certificate_no} · Issued: {new Date(cert.issued_date).toLocaleDateString()}
          </div>
          <div className="mt-1 text-[9px] text-gray-400">Verified by SKB Education Ecosystem</div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #cert-print, #cert-print * { visibility: visible; }
          #cert-print { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}
