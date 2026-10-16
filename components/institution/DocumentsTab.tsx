"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const DOC_TYPES = [
  { v: "birth_certificate", l: "Birth Certificate", e: "📜" },
  { v: "transcript", l: "Transcript", e: "📄" },
  { v: "id_card", l: "ID Card", e: "🪪" },
  { v: "photo", l: "Photo", e: "🖼️" },
  { v: "medical", l: "Medical", e: "🏥" },
  { v: "transfer_certificate", l: "Transfer Cert", e: "📃" },
  { v: "nid", l: "NID", e: "🆔" },
  { v: "other", l: "Other", e: "📎" },
];

export default function DocumentsTab({ institutionId, isAdmin }: { institutionId: string; isAdmin: boolean }) {
  const [students, setStudents] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({ doc_type: "birth_certificate", title: "", issued_date: "", notes: "" });
  const [file, setFile] = useState<File | null>(null);

  const load = async () => {
    setLoading(true);
    const [s, d] = await Promise.all([
      supabase.from("students").select("id, full_name, student_id").eq("institution_id", institutionId).order("full_name"),
      supabase.from("student_documents").select("*, students:student_id(full_name, student_id)").eq("institution_id", institutionId).order("created_at", { ascending: false }).limit(500),
    ]);
    setStudents(s.data ?? []);
    setDocs(d.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [institutionId]);

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !selectedStudent || !file || !form.title.trim()) { setErr("File + Title"); return; }
    setUploading(true); setErr("");
    const ext = file.name.split(".").pop() || "bin";
    const path = `${(await supabase.auth.getUser()).data.user?.id}/${selectedStudent.id}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("student-documents").upload(path, file, { contentType: file.type });
    if (upErr) { setErr(upErr.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("student-documents").getPublicUrl(path);

    const { error } = await supabase.from("student_documents").insert({
      institution_id: institutionId, student_id: selectedStudent.id,
      doc_type: form.doc_type, title: form.title.trim(),
      file_url: urlData.publicUrl, file_size: file.size, mime_type: file.type,
      issued_date: form.issued_date || null, notes: form.notes.trim() || null,
      uploaded_by: (await supabase.auth.getUser()).data.user?.id,
    });
    setUploading(false);
    if (error) { setErr(error.message); return; }
    setForm({ doc_type: "birth_certificate", title: "", issued_date: "", notes: "" });
    setFile(null);
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete document?")) return;
    await supabase.from("student_documents").delete().eq("id", id);
    await load();
  };

  const filtered = students.filter((s) => !search || s.full_name.toLowerCase().includes(search.toLowerCase()) || (s.student_id || "").toLowerCase().includes(search.toLowerCase()));
  const studentDocs = selectedStudent ? docs.filter((d) => d.student_id === selectedStudent.id) : [];

  if (!isAdmin) return <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}><div className="text-[36px]">🔒</div><div className="mt-2 text-[14px] font-semibold">Admin access required</div></div>;

  if (selectedStudent) {
    return (
      <div>
        <button onClick={() => { setSelectedStudent(null); setFile(null); }} className="text-[13px] mb-3" style={{ color: "var(--text-muted)" }}>← Back</button>
        <div className="rounded-2xl border p-5 mb-4" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="text-[16px] font-semibold">{selectedStudent.full_name}</div>
          <div className="text-[12px] font-mono" style={{ color: "var(--text-muted)" }}>{selectedStudent.student_id}</div>
        </div>

        <form onSubmit={upload} className="mb-4 rounded-2xl border p-4 space-y-3" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select value={form.doc_type} onChange={(e) => setForm({ ...form, doc_type: e.target.value })}
              className="rounded-xl border px-3.5 py-2 text-[13px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              {DOC_TYPES.map((t) => <option key={t.v} value={t.v}>{t.e} {t.l}</option>)}
            </select>
            <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Document title *"
              className="rounded-xl border px-3.5 py-2 text-[13px] outline-none sm:col-span-2"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <input type="date" value={form.issued_date} onChange={(e) => setForm({ ...form, issued_date: e.target.value })}
              className="rounded-xl border px-3.5 py-2 text-[13px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Notes (optional)"
              className="rounded-xl border px-3.5 py-2 text-[13px] outline-none sm:col-span-2"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
          </div>
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full rounded-xl border px-3.5 py-2 text-[13px] file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-emerald-500/15 file:text-emerald-700 file:font-semibold file:text-[12px]"
            style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
          {err && <div className="text-[12px] text-rose-600">{err}</div>}
          <button type="submit" disabled={uploading || !file || !form.title.trim()}
            className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-2 text-[13px] font-semibold text-white disabled:opacity-50">
            {uploading ? "Uploading..." : "📤 Upload"}
          </button>
        </form>

        {studentDocs.length === 0 ? (
          <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            <div className="text-[36px]">📁</div>
            <div className="mt-2 text-[14px] font-semibold">No documents</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {studentDocs.map((d) => {
              const t = DOC_TYPES.find((x) => x.v === d.doc_type) ?? DOC_TYPES[0];
              return (
                <div key={d.id} className="rounded-2xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                  <div className="flex items-start gap-2">
                    <div className="text-[20px]">{t.e}</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold truncate">{d.title}</div>
                      <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>{t.l}</div>
                      {d.issued_date && <div className="text-[10px]" style={{ color: "var(--text-faint)" }}>Issued: {new Date(d.issued_date).toLocaleDateString()}</div>}
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <a href={d.file_url} target="_blank" rel="noopener noreferrer"
                        className="rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold text-emerald-700">👁 View</a>
                      <button onClick={() => remove(d.id)} className="rounded-full px-2 py-1 text-[10px] text-rose-600 hover:bg-rose-500/10">✕</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[16px] font-semibold">Documents · <span className="bangla font-normal">ডকুমেন্ট ভল্ট</span></h2>
      </div>

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Search students..."
        className="w-full rounded-full border px-4 py-2 text-[13px] outline-none mb-3"
        style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />

      {loading ? (
        <div className="text-center py-10 text-[13px]" style={{ color: "var(--text-muted)" }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="text-[36px]">👥</div>
          <div className="mt-2 text-[14px] font-semibold">No students</div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => {
            const c = docs.filter((d) => d.student_id === s.id).length;
            return (
              <button key={s.id} onClick={() => setSelectedStudent(s)}
                className="w-full rounded-2xl border p-3 flex items-center gap-3 text-left hover:bg-[var(--bg-soft)]"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <div className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold text-white" style={{ background: "linear-gradient(135deg,#10b981,#14b8a6)" }}>
                  {s.full_name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold truncate">{s.full_name}</div>
                  <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>{s.student_id}</div>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">📁 {c}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
