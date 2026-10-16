"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TeachersTab({ institutionId, isAdmin }: { institutionId: string; isAdmin: boolean }) {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("teacher");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [tRes, iRes] = await Promise.all([
      supabase.from("memberships").select("id, role, user_id, profiles:user_id(full_name, email)")
        .eq("institution_id", institutionId).in("role", ["teacher", "parent", "accountant"]),
      supabase.from("invitations").select("*").eq("institution_id", institutionId)
        .order("created_at", { ascending: false }),
    ]);
    setTeachers(tRes.data ?? []);
    setInvites(iRes.data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [institutionId]);

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSaving(true); setErr("");
    const { error } = await supabase.from("invitations").insert({
      institution_id: institutionId, email: email.trim().toLowerCase(), role,
    });
    if (error) { setErr(error.message); setSaving(false); return; }
    setEmail(""); setShowForm(false); setSaving(false);
    await load();
  };

  const revoke = async (id: string) => {
    if (!confirm("Revoke?")) return;
    await supabase.from("invitations").update({ status: "cancelled" }).eq("id", id);
    await load();
  };

  const copyLink = async (token: string) => {
    const url = window.location.origin + "/skb-education-ecosystem/join/?token=" + token;
    await navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  const roleBadge = (r: string) => ({
    teacher: { label: "Teacher", emoji: "👨‍🏫", color: "emerald" },
    parent:  { label: "Parent",  emoji: "👪",   color: "teal" },
    accountant: { label: "Accountant", emoji: "💰", color: "amber" },
  } as any)[r] ?? { label: r, emoji: "👤", color: "slate" };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[16px] font-semibold">Staff · <span className="bangla font-normal">কর্মী</span></h2>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)}
            className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow">
            {showForm ? "Cancel" : "+ Invite"}
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <form onSubmit={sendInvite} className="mb-4 rounded-2xl border p-4 space-y-3"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-3">
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Email *</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@school.edu.bd"
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <option value="teacher">👨‍🏫 Teacher</option>
                <option value="parent">👪 Parent</option>
                <option value="accountant">💰 Accountant</option>
              </select>
            </div>
          </div>
          {err && <div className="text-[12px] text-rose-600">{err}</div>}
          <button type="submit" disabled={saving}
            className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-2 text-[13px] font-semibold text-white disabled:opacity-50">
            {saving ? "..." : "Send Invite"}
          </button>
        </form>
      )}

      <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
        Active Staff ({teachers.length})
      </h3>
      {loading ? (
        <div className="text-[13px] text-center py-6" style={{ color: "var(--text-muted)" }}>Loading...</div>
      ) : teachers.length === 0 ? (
        <div className="rounded-2xl border p-6 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="text-[28px]">👨‍🏫</div>
          <div className="mt-2 text-[13px]" style={{ color: "var(--text-muted)" }}>No staff yet</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {teachers.map((t) => {
            const rb = roleBadge(t.role);
            return (
              <div key={t.id} className="rounded-2xl border p-4 flex items-center gap-3"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-[13px]">
                  {(t.profiles?.full_name || t.profiles?.email || "?").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold truncate">{t.profiles?.full_name || "User"}</div>
                  <div className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>{t.profiles?.email}</div>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  {rb.emoji} {rb.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
        Pending Invitations ({invites.filter((i) => i.status === "pending").length})
      </h3>
      {invites.filter((i) => i.status === "pending").length === 0 ? (
        <div className="rounded-2xl border p-6 text-center text-[13px]" style={{ borderColor: "var(--border)", background: "var(--surface-3)", color: "var(--text-muted)" }}>
          No pending invitations
        </div>
      ) : (
        <div className="space-y-2">
          {invites.filter((i) => i.status === "pending").map((inv) => {
            const rb = roleBadge(inv.role);
            return (
              <div key={inv.id} className="rounded-2xl border p-3 flex items-center justify-between gap-3"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium truncate">{inv.email}</div>
                  <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {rb.emoji} {rb.label} · Expires {new Date(inv.expires_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => copyLink(inv.token)}
                    className="rounded-full border px-3 py-1 text-[11px] font-medium"
                    style={{ borderColor: "var(--border)" }}>
                    {copied === inv.token ? "✓ Copied" : "Copy Link"}
                  </button>
                  {isAdmin && (
                    <button onClick={() => revoke(inv.id)}
                      className="rounded-full px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-500/10">
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
