"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function BulkImportModal({
  institutionId, onClose, onComplete,
}: { institutionId: string; onClose: () => void; onComplete: () => void }) {
  const [step, setStep] = useState<"upload"|"preview"|"importing"|"done">("upload");
  const [rows, setRows] = useState<any[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) throw new Error("CSV file-এ header + data লাগবে");

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
    const required = ["full_name"];
    for (const r of required) {
      if (!headers.includes(r)) throw new Error(`Required column missing: ${r}`);
    }

    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = parseCSVLine(lines[i]);
      const row: any = {};
      headers.forEach((h, idx) => { row[h] = vals[idx]?.trim() || ""; });
      if (row.full_name) data.push(row);
    }
    return data;
  };

  const parseCSVLine = (line: string) => {
    const result = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === "," && !inQuotes) { result.push(cur); cur = ""; }
      else cur += ch;
    }
    result.push(cur);
    return result;
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { setError("File max 2 MB"); return; }
    setFileName(f.name);
    setError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const data = parseCSV(text);
        if (data.length === 0) throw new Error("No valid rows");
        if (data.length > 500) throw new Error("Max 500 rows per import");
        setRows(data);
        setStep("preview");
      } catch (err: any) {
        setError(err.message);
      }
    };
    reader.readAsText(f);
  };

  const doImport = async () => {
    setStep("importing"); setError("");
    const payload = rows.map((r) => ({
      full_name: r.full_name,
      roll_number: r.roll_number || "",
      class_name: r.class_name || r.class || "",
      class_role: r.class_role || "student",
      email: r.email || "",
      guardian_email: r.guardian_email || "",
      guardian_name: r.guardian_name || "",
      guardian_phone: r.guardian_phone || "",
      address: r.address || "",
    }));

    const { data, error } = await supabase.rpc("bulk_import_students", {
      p_institution_id: institutionId,
      p_students: payload,
    });

    if (error) { setError(error.message); setStep("preview"); return; }
    setResult(data);
    setStep("done");
    onComplete();
  };

  const downloadTemplate = () => {
    const csv = `full_name,roll_number,class_name,class_role,email,guardian_email,guardian_name,guardian_phone,address
Sakib Al Hasan,01,Class 10,student,sakib@example.com,parent@example.com,Abdul Hasan,+8801700000001,Mirpur Dhaka
Nusrat Jahan,02,Class 10,student,,,
Rafiq Ahmed,03,Class 10,captain,,,`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "skb-students-template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur p-4 overflow-y-auto">
      <div className="w-full max-w-2xl my-8 rounded-3xl border shadow-2xl"
        style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>

        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--border)" }}>
          <div>
            <div className="text-[16px] font-semibold">Bulk Import Students</div>
            <div className="bangla text-[12px]" style={{ color: "var(--text-muted)" }}>একসাথে অনেক ছাত্র যোগ করুন</div>
          </div>
          <button onClick={onClose} className="rounded-full w-8 h-8 flex items-center justify-center hover:bg-[var(--bg-soft)]">✕</button>
        </div>

        <div className="p-6">
          {step === "upload" && (
            <>
              <div className="rounded-2xl border-2 border-dashed p-8 text-center"
                style={{ borderColor: "var(--border-strong)", background: "var(--bg-soft)" }}>
                <div className="text-[48px]">📄</div>
                <div className="mt-3 text-[14px] font-semibold">Upload CSV File</div>
                <div className="text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>
                  Max 500 rows · 2 MB limit
                </div>
                <input type="file" accept=".csv,text/csv" onChange={onFile} className="hidden" id="csv-upload" />
                <label htmlFor="csv-upload"
                  className="mt-4 inline-block rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow cursor-pointer">
                  Choose File
                </label>
                {fileName && <div className="mt-3 text-[12px]" style={{ color: "var(--text-muted)" }}>📎 {fileName}</div>}
              </div>

              <div className="mt-5 rounded-2xl border p-4" style={{ borderColor: "var(--border)" }}>
                <div className="text-[13px] font-semibold mb-2">📋 CSV Format</div>
                <div className="text-[11px] space-y-1" style={{ color: "var(--text-muted)" }}>
                  <div>• <strong>Required:</strong> full_name</div>
                  <div>• <strong>Optional:</strong> roll_number, class_name, class_role, email, guardian_email, guardian_name, guardian_phone, address</div>
                  <div>• <strong>class_role:</strong> student / captain / assistant_captain / prefect / monitor</div>
                  <div>• class_name অবশ্যই existing class-এর সাথে মিলতে হবে</div>
                </div>
                <button onClick={downloadTemplate}
                  className="mt-3 text-[12px] font-medium text-emerald-700 underline">↓ Download template CSV</button>
              </div>

              {error && <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-[13px] text-rose-700">{error}</div>}
            </>
          )}

          {step === "preview" && (
            <>
              <div className="mb-4 rounded-xl p-3 flex items-center justify-between" style={{ background: "var(--bg-soft)" }}>
                <div>
                  <div className="text-[13px] font-semibold">✅ Parsed successfully</div>
                  <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>{rows.length} students ready</div>
                </div>
                <button onClick={() => { setStep("upload"); setRows([]); setFileName(""); }}
                  className="text-[12px] text-rose-600">Change file</button>
              </div>

              <div className="max-h-[300px] overflow-y-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
                <table className="w-full text-[12px]">
                  <thead className="sticky top-0" style={{ background: "var(--bg-soft)" }}>
                    <tr>
                      <th className="p-2 text-left font-semibold">#</th>
                      <th className="p-2 text-left font-semibold">Name</th>
                      <th className="p-2 text-left font-semibold">Roll</th>
                      <th className="p-2 text-left font-semibold">Class</th>
                      <th className="p-2 text-left font-semibold">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className="border-t" style={{ borderColor: "var(--border)" }}>
                        <td className="p-2" style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                        <td className="p-2 font-medium">{r.full_name}</td>
                        <td className="p-2">{r.roll_number || "—"}</td>
                        <td className="p-2">{r.class_name || r.class || "—"}</td>
                        <td className="p-2 capitalize">{r.class_role || "student"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {error && <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-[13px] text-rose-700">{error}</div>}

              <div className="mt-5 flex gap-3">
                <button onClick={doImport}
                  className="flex-1 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 py-3 text-[14px] font-semibold text-white shadow">
                  🚀 Import {rows.length} Students
                </button>
                <button onClick={onClose}
                  className="rounded-full border px-5 py-3 text-[13px]" style={{ borderColor: "var(--border)" }}>Cancel</button>
              </div>
            </>
          )}

          {step === "importing" && (
            <div className="py-10 text-center">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
              <div className="mt-3 text-[14px] font-semibold">Importing {rows.length} students...</div>
              <div className="text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>Please wait</div>
            </div>
          )}

          {step === "done" && result && (
            <div className="text-center py-6">
              <div className="text-[56px]">🎉</div>
              <div className="mt-3 text-[18px] font-semibold">Import Complete</div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl p-4 bg-emerald-500/10 border border-emerald-500/30">
                  <div className="text-[28px] font-bold text-emerald-700">{result.success}</div>
                  <div className="text-[11px] uppercase font-semibold text-emerald-700">Succeeded</div>
                </div>
                <div className="rounded-xl p-4 bg-rose-500/10 border border-rose-500/30">
                  <div className="text-[28px] font-bold text-rose-700">{result.failed}</div>
                  <div className="text-[11px] uppercase font-semibold text-rose-700">Failed</div>
                </div>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="mt-4 text-left rounded-xl border border-rose-500/30 bg-rose-500/5 p-3 max-h-[200px] overflow-y-auto">
                  <div className="text-[12px] font-semibold text-rose-700 mb-2">Errors:</div>
                  {result.errors.slice(0, 20).map((e: any, i: number) => (
                    <div key={i} className="text-[11px] text-rose-600">Row {e.row}: {e.reason}</div>
                  ))}
                </div>
              )}

              <button onClick={onClose}
                className="mt-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-8 py-3 text-[14px] font-semibold text-white shadow">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
