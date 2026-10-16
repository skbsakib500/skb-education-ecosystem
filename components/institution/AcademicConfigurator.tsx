"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

type StreamType = "general" | "madrasah" | "technical" | "higher_ed";

interface StreamDef {
  label: string;
  bn: string;
  emoji: string;
  levelLabel: { en: string; bn: string };
  levels: string[];
  defaultTerm: "annual" | "semester" | "trimester";
}

const STREAMS: Record<StreamType, StreamDef> = {
  general: {
    label: "General Education", bn: "সাধারণ শিক্ষা", emoji: "🏫",
    levelLabel: { en: "Class", bn: "শ্রেণি" },
    levels: ["Class 1","Class 2","Class 3","Class 4","Class 5","Class 6","Class 7","Class 8","Class 9","Class 10","Class 11","Class 12"],
    defaultTerm: "annual",
  },
  madrasah: {
    label: "Madrasah Education", bn: "মাদ্রাসা শিক্ষা", emoji: "🕌",
    levelLabel: { en: "Grade", bn: "জামাত" },
    levels: ["Ebtedayee 1","Ebtedayee 2","Ebtedayee 3","Ebtedayee 4","Ebtedayee 5","Dakhil 1","Dakhil 2","Dakhil 3","Alim 1","Alim 2","Fazil 1","Fazil 2","Kamil 1","Kamil 2"],
    defaultTerm: "annual",
  },
  technical: {
    label: "Technical & Vocational", bn: "কারিগরি ও ভোকেশনাল", emoji: "⚙️",
    levelLabel: { en: "Level", bn: "লেভেল" },
    levels: ["SSC (Vocational) 1","SSC (Vocational) 2","Diploma 1","Diploma 2","Diploma 3","Diploma 4","Trade 1","Trade 2"],
    defaultTerm: "semester",
  },
  higher_ed: {
    label: "Higher Education", bn: "উচ্চশিক্ষা", emoji: "🏛️",
    levelLabel: { en: "Semester", bn: "সেমিস্টার" },
    levels: ["Semester 1","Semester 2","Semester 3","Semester 4","Semester 5","Semester 6","Semester 7","Semester 8","Year 1","Year 2","Year 3","Year 4","Year 5"],
    defaultTerm: "semester",
  },
};

export default function AcademicConfigurator({
  institutionId, initialStream = "general", initialLevels = [], isAdmin = false, onSave,
}: {
  institutionId: string;
  initialStream?: StreamType;
  initialLevels?: string[];
  isAdmin?: boolean;
  onSave?: () => void;
}) {
  const [stream, setStream] = useState<StreamType>(initialStream);
  const [selected, setSelected] = useState<string[]>(initialLevels);
  const [term, setTerm] = useState<"annual"|"semester"|"trimester">(STREAMS[initialStream].defaultTerm);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);
  const [custom, setCustom] = useState("");

  const def = STREAMS[stream];

  const changeStream = (s: StreamType) => {
    setStream(s);
    setTerm(STREAMS[s].defaultTerm);
    if (selected.length === 0) setSelected(STREAMS[s].levels.slice(0, 3));
  };

  const toggle = (lv: string) => setSelected((p) => p.includes(lv) ? p.filter((x) => x !== lv) : [...p, lv]);
  const selectAll = () => setSelected(def.levels);
  const clearAll = () => setSelected([]);
  const addCustom = () => {
    const v = custom.trim();
    if (!v || selected.includes(v)) return;
    setSelected([...selected, v]);
    setCustom("");
  };

  const save = async () => {
    if (selected.length === 0) { setErr("অন্তত একটি level select করুন"); return; }
    setSaving(true); setErr(""); setOk(false);
    const { error } = await supabase.from("institutions").update({
      academic_stream: stream, academic_term: term,
      level_label: def.levelLabel.en, levels: selected,
    }).eq("id", institutionId);
    setSaving(false);
    if (error) { setErr(error.message); return; }
    setOk(true); onSave?.(); setTimeout(() => setOk(false), 2500);
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[15px] font-semibold">Academic Structure</div>
        <div className="bangla text-[12px]" style={{ color: "var(--text-muted)" }}>আপনার প্রতিষ্ঠানের একাডেমিক কাঠামো কনফিগার করুন</div>
      </div>

      <div>
        <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Education Stream · শিক্ষা স্ট্রিম</label>
        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
          {(Object.keys(STREAMS) as StreamType[]).map((s) => {
            const meta = STREAMS[s]; const active = stream === s;
            return (
              <button key={s} type="button" onClick={() => changeStream(s)}
                className={"rounded-2xl border p-3 text-left transition " + (active ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg border-transparent" : "")}
                style={!active ? { borderColor: "var(--border)", background: "var(--surface-3)" } : {}}>
                <div className="text-[22px]">{meta.emoji}</div>
                <div className="mt-1 text-[12.5px] font-semibold">{meta.label}</div>
                <div className={"bangla text-[11px] " + (active ? "opacity-90" : "")} style={!active ? { color: "var(--text-muted)" } : {}}>{meta.bn}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Academic Term · একাডেমিক টার্ম</label>
        <div className="mt-2 flex gap-2">
          {[
            { v: "annual", l: "Annual", bn: "বার্ষিক", e: "📅" },
            { v: "semester", l: "Semester", bn: "সেমিস্টার", e: "🗓️" },
            { v: "trimester", l: "Trimester", bn: "ট্রাইমেস্টার", e: "📆" },
          ].map((t) => (
            <button key={t.v} type="button" onClick={() => setTerm(t.v as any)}
              className={"flex-1 rounded-xl border px-3 py-2.5 text-[12.5px] font-medium transition " + (term === t.v ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700" : "")}
              style={term !== t.v ? { borderColor: "var(--border)", background: "var(--surface-3)" } : {}}>
              <span className="mr-1">{t.e}</span>{t.l}
              <span className="bangla ml-1 text-[11px] opacity-70">· {t.bn}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>
            {def.levelLabel.en} List · {def.levelLabel.bn} তালিকা ({selected.length} selected)
          </label>
          {isAdmin && (
            <div className="flex gap-1">
              <button onClick={selectAll} className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: "var(--bg-soft)" }}>All</button>
              <button onClick={clearAll} className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: "var(--bg-soft)" }}>None</button>
            </div>
          )}
        </div>
        <div className="rounded-2xl border p-3 space-y-1.5" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          {def.levels.map((lv) => {
            const checked = selected.includes(lv);
            return (
              <label key={lv} className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-[var(--bg-soft)] cursor-pointer">
                <input type="checkbox" checked={checked} disabled={!isAdmin} onChange={() => toggle(lv)}
                  className="h-4 w-4 rounded accent-emerald-500" />
                <span className="text-[13px]">{lv}</span>
              </label>
            );
          })}
          {selected.filter((s) => !def.levels.includes(s)).map((s) => (
            <div key={s} className="flex items-center justify-between rounded-xl px-2 py-1.5" style={{ background: "var(--bg-soft)" }}>
              <span className="text-[13px] font-medium">{s} <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>(custom)</span></span>
              {isAdmin && <button onClick={() => toggle(s)} className="text-[11px] text-rose-600">Remove</button>}
            </div>
          ))}
        </div>
        {isAdmin && (
          <div className="mt-2 flex gap-2">
            <input type="text" value={custom} onChange={(e) => setCustom(e.target.value)}
              placeholder={"Custom " + def.levelLabel.en}
              className="flex-1 rounded-xl border px-3 py-2 text-[13px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <button type="button" onClick={addCustom}
              className="rounded-xl border px-4 py-2 text-[12px] font-medium" style={{ borderColor: "var(--border)" }}>
              + Add
            </button>
          </div>
        )}
      </div>

      <div className="rounded-xl border p-3 text-[12px]" style={{ borderColor: "var(--border)", background: "var(--bg-soft)", color: "var(--text-muted)" }}>
        <div className="font-medium mb-1" style={{ color: "var(--text)" }}>ℹ️ নির্বাচিত ব্যবস্থা</div>
        <div className="bangla">{def.emoji} {def.bn} · {def.levelLabel.bn} পদ্ধতি · {term === "annual" ? "বার্ষিক" : term === "semester" ? "সেমিস্টার" : "ট্রাইমেস্টার"} ভিত্তিক</div>
      </div>

      {isAdmin && (
        <div className="flex items-center gap-3">
          <button type="button" onClick={save} disabled={saving}
            className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow disabled:opacity-50">
            {saving ? "Saving..." : "💾 Save Academic Structure"}
          </button>
          {ok && <span className="text-[12px] text-emerald-600 font-medium">✓ Saved!</span>}
          {err && <span className="text-[12px] text-rose-600">{err}</span>}
        </div>
      )}
    </div>
  );
}
