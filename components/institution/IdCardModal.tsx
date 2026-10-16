"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import PremiumIdCard from "./PremiumIdCard";

export default function IdCardModal({ institutionId, onClose }: { institutionId: string; onClose: () => void }) {
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [institution, setInstitution] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [tierMap, setTierMap] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const [cRes, iRes] = await Promise.all([
        supabase.from("classes").select("*").eq("institution_id", institutionId).order("name"),
        supabase.from("institutions").select("name, logo_url, emoji, motto, division, city").eq("id", institutionId).single(),
      ]);
      setClasses(cRes.data ?? []);
      setInstitution(iRes.data);
      if (cRes.data && cRes.data.length > 0) setSelectedClass(cRes.data[0].id);
      setLoading(false);
    })();
  }, [institutionId]);

  useEffect(() => {
    if (!selectedClass) return;
    (async () => {
      const { data } = await supabase.from("students").select("*, classes:class_id(name, section)")
        .eq("institution_id", institutionId).eq("class_id", selectedClass).order("roll_number");
      const list = data ?? [];
      setStudents(list);
      setSelected(list.map((s: any) => s.id));

      // Get tiers for all
      const tmap: Record<string, string> = {};
      await Promise.all(list.map(async (s: any) => {
        const { data: t } = await supabase.rpc("get_card_tier", { p_student_id: s.id });
        tmap[s.id] = (t as string) || "bronze";
      }));
      setTierMap(tmap);
    })();
  }, [selectedClass, institutionId]);

  const toggle = (id: string) => setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const selectedStudents = students.filter((s) => selected.includes(s.id));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur p-4 overflow-y-auto">
      <div className="w-full max-w-6xl my-8 rounded-3xl border shadow-2xl"
        style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>

        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--border)" }}>
          <div>
            <div className="text-[16px] font-semibold">🎫 Premium ID Cards</div>
            <div className="text-[12px]" style={{ color: "var(--text-muted)" }}>
              6-tier premium cards · QR verify · Print-ready
            </div>
          </div>
          <button onClick={onClose} className="rounded-full w-8 h-8 flex items-center justify-center hover:bg-[var(--bg-soft)]">✕</button>
        </div>

        <div className="p-5">
          {/* Tier Legend */}
          <div className="mb-5 flex flex-wrap gap-2 text-[10px]">
            <span className="rounded-full px-2 py-1 font-semibold" style={{ background: "#d9770620", color: "#d97706" }}>🥉 Bronze — Free</span>
            <span className="rounded-full px-2 py-1 font-semibold" style={{ background: "#94a3b820", color: "#64748b" }}>🥈 Silver — Starter</span>
            <span className="rounded-full px-2 py-1 font-semibold" style={{ background: "#fbbf2420", color: "#d97706" }}>🥇 Gold — Pro/Captain</span>
            <span className="rounded-full px-2 py-1 font-semibold" style={{ background: "#a78bfa20", color: "#7c3aed" }}>💎 Platinum — Enterprise</span>
            <span className="rounded-full px-2 py-1 font-semibold" style={{ background: "#22d3ee20", color: "#0891b2" }}>⚫ Diamond — Admin</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
              className="rounded-xl border px-3.5 py-2 text-[14px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}{c.section ? " · " + c.section : ""}</option>)}
            </select>
            <div className="flex items-center gap-2 text-[12px]">
              <button onClick={() => setSelected(students.map((s) => s.id))} className="rounded-full border px-3 py-1" style={{ borderColor: "var(--border)" }}>All</button>
              <button onClick={() => setSelected([])} className="rounded-full border px-3 py-1" style={{ borderColor: "var(--border)" }}>None</button>
              <span style={{ color: "var(--text-muted)" }}>{selected.length} selected</span>
            </div>
          </div>

          <div className="max-h-[150px] overflow-y-auto rounded-xl border p-2 mb-4"
            style={{ borderColor: "var(--border)" }}>
            {students.map((s) => {
              const tier = tierMap[s.id] || "bronze";
              const tierEmoji: any = { bronze: "🥉", silver: "🥈", gold: "🥇", platinum: "💎", diamond: "⚫", cosmic: "🌌" };
              return (
                <label key={s.id} className="flex items-center gap-2 px-2 py-1 hover:bg-[var(--bg-soft)] rounded cursor-pointer">
                  <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggle(s.id)} className="accent-emerald-500" />
                  <span className="text-[13px]">{s.full_name}</span>
                  {s.roll_number && <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Roll {s.roll_number}</span>}
                  <span className="ml-auto text-[10px] font-semibold capitalize">{tierEmoji[tier]} {tier}</span>
                </label>
              );
            })}
          </div>

          {selectedStudents.length > 0 && (
            <>
              <div className="flex justify-end mb-4">
                <button onClick={() => window.print()}
                  className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-2 text-[13px] font-semibold text-white shadow">
                  🖨️ Print {selectedStudents.length} Premium Cards
                </button>
              </div>

              <div id="id-cards" className="flex flex-wrap gap-4 justify-center p-4 bg-gray-50 rounded-xl">
                {selectedStudents.map((s) => (
                  <PremiumIdCard
                    key={s.id}
                    tier={tierMap[s.id] || "bronze"}
                    institution={institution}
                    student={{
                      full_name: s.full_name,
                      student_id: s.student_id,
                      roll_number: s.roll_number,
                      class_name: s.classes?.name,
                      section: s.classes?.section,
                      guardian_phone: s.guardian_phone,
                      blood_group: s.blood_group,
                      class_role: s.class_role,
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #id-cards, #id-cards * { visibility: visible; }
          #id-cards { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}
