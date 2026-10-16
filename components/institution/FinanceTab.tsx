"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import FeeReceipt from "./FeeReceipt";

const PAYMENT_METHODS = [
  { value: "cash",   label: "Cash",   emoji: "💵" },
  { value: "bkash",  label: "bKash",  emoji: "📱" },
  { value: "nagad",  label: "Nagad",  emoji: "📱" },
  { value: "rocket", label: "Rocket", emoji: "📱" },
  { value: "bank",   label: "Bank",   emoji: "🏦" },
  { value: "card",   label: "Card",   emoji: "💳" },
  { value: "other",  label: "Other",  emoji: "💰" },
];

export default function FinanceTab({ institutionId, isAdmin }: { institutionId: string; isAdmin: boolean }) {
  const [view, setView] = useState<"overview"|"structures"|"payments">("overview");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.rpc("finance_summary", { p_institution_id: institutionId });
    setStats(Array.isArray(data) ? data[0] : data);
    setLoading(false);
  };
  useEffect(() => { load(); }, [institutionId]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-[16px] font-semibold">Finance · <span className="bangla font-normal">হিসাব</span></h2>
        <div className="flex gap-1 rounded-full border p-1 text-[12px]"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          {[
            { k: "overview",  l: "Overview" },
            { k: "structures",l: "Fee Plans" },
            { k: "payments",  l: "Payments" },
          ].map((t) => (
            <button key={t.k} onClick={() => setView(t.k as any)}
              className={"rounded-full px-3 py-1 font-medium " + (view === t.k ? "bg-[var(--text)] text-[var(--bg)]" : "")}
              style={view !== t.k ? { color: "var(--text-muted)" } : {}}>{t.l}</button>
          ))}
        </div>
      </div>

      {view === "overview" && <Overview stats={stats} loading={loading} />}
      {view === "structures" && <FeeStructures institutionId={institutionId} isAdmin={isAdmin} />}
      {view === "payments" && <Payments institutionId={institutionId} isAdmin={isAdmin} onChange={load} />}
    
    </div>
  );
}

function Overview({ stats, loading }: { stats: any; loading: boolean }) {
  if (loading) return <div className="text-center py-10 text-[13px]" style={{ color: "var(--text-muted)" }}>Loading...</div>;
  if (!stats) return <div className="text-center py-10 text-[13px]" style={{ color: "var(--text-muted)" }}>No data</div>;

  const pct = Number(stats.total_expected) > 0
    ? Math.round((Number(stats.total_collected) / Number(stats.total_expected)) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-2xl border p-5 col-span-full md:col-span-2"
        style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[12px] font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Collection Rate</div>
            <div className="text-[28px] font-semibold">{pct}%</div>
          </div>
          <div className="text-right">
            <div className="text-[24px] font-bold text-emerald-600">৳{Number(stats.total_collected).toLocaleString()}</div>
            <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              of ৳{Number(stats.total_expected).toLocaleString()}
            </div>
          </div>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-soft)" }}>
          <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: pct + "%" }} />
        </div>
      </div>

      <StatBox label="Collected" bn="সংগৃহীত" value={"৳" + Number(stats.total_collected).toLocaleString()} color="emerald" />
      <StatBox label="Pending" bn="বাকি" value={"৳" + Number(stats.total_pending).toLocaleString()} color="amber" />
      <StatBox label="Paid Records" bn="পরিশোধিত" value={String(stats.paid_count)} color="emerald" />
      <StatBox label="Overdue" bn="মেয়াদোত্তীর্ণ" value={String(stats.overdue_count)} color="rose" />
    </div>
  );
}

function StatBox({ label, bn, value, color }: { label: string; bn: string; value: string; color: string }) {
  const colors: any = { emerald: "#10b981", amber: "#f59e0b", rose: "#f43f5e", teal: "#14b8a6" };
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
      <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{label}</div>
      <div className="text-[22px] font-semibold mt-1" style={{ color: colors[color] ?? "var(--text)" }}>{value}</div>
      <div className="bangla text-[11px]" style={{ color: "var(--text-faint)" }}>{bn}</div>
    </div>
  );
}

function FeeStructures({ institutionId, isAdmin }: { institutionId: string; isAdmin: boolean }) {
  const [items, setItems] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({
    name: "", amount: 0, class_id: "", frequency: "monthly",
    due_day: 10, description: "",
  });

  const load = async () => {
    setLoading(true);
    const [fRes, cRes] = await Promise.all([
      supabase.from("fee_structures").select("*, classes:class_id(name)").eq("institution_id", institutionId)
        .eq("is_active", true).order("name"),
      supabase.from("classes").select("*").eq("institution_id", institutionId).order("name"),
    ]);
    setItems(fRes.data ?? []);
    setClasses(cRes.data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [institutionId]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.amount <= 0) return;
    setSaving(true); setErr("");
    const { error } = await supabase.from("fee_structures").insert({
      institution_id: institutionId, name: form.name.trim(),
      amount: form.amount, class_id: form.class_id || null,
      frequency: form.frequency, due_day: form.due_day,
      description: form.description.trim() || null,
    });
    if (error) { setErr(error.message); setSaving(false); return; }
    setForm({ name: "", amount: 0, class_id: "", frequency: "monthly", due_day: 10, description: "" });
    setShowForm(false); setSaving(false); await load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete fee structure?")) return;
    await supabase.from("fee_structures").update({ is_active: false }).eq("id", id);
    await load();
  };

  return (
    <div>
      {isAdmin && (
        <button onClick={() => setShowForm(!showForm)}
          className="mb-4 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow">
          {showForm ? "Cancel" : "+ New Fee Plan"}
        </button>
      )}

      {showForm && isAdmin && (
        <form onSubmit={add} className="mb-4 rounded-2xl border p-4 space-y-3"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Fee Name *</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Monthly Tuition / Admission Fee / Exam Fee"
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Amount (৳) *</label>
              <input type="number" required min="1" value={form.amount}
                onChange={(e) => setForm({ ...form, amount: parseInt(e.target.value) || 0 })}
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Frequency</label>
              <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <option value="one_time">One Time</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Class</label>
              <select value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <option value="">All classes</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Due Day (of month)</label>
              <input type="number" min="1" max="31" value={form.due_day}
                onChange={(e) => setForm({ ...form, due_day: parseInt(e.target.value) || 10 })}
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>
          </div>
          {err && <div className="text-[12px] text-rose-600">{err}</div>}
          <button type="submit" disabled={saving}
            className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-2 text-[13px] font-semibold text-white disabled:opacity-50">
            {saving ? "Saving..." : "Save Fee Plan"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-10 text-[13px]" style={{ color: "var(--text-muted)" }}>Loading...</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="text-[36px]">💵</div>
          <div className="mt-2 text-[14px] font-semibold">No fee plans yet</div>
          <div className="bangla text-[12px]" style={{ color: "var(--text-muted)" }}>প্রথম fee plan তৈরি করুন</div>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((f) => (
            <div key={f.id} className="rounded-2xl border p-4 flex items-center justify-between gap-3"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold">{f.name}</div>
                <div className="flex flex-wrap gap-2 mt-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-700 font-semibold">৳{Number(f.amount).toLocaleString()}</span>
                  <span className="capitalize">{f.frequency.replace("_", " ")}</span>
                  {f.classes?.name && <span>🎓 {f.classes.name}</span>}
                  {f.due_day && <span>Due: {f.due_day}th</span>}
                </div>
              </div>
              {isAdmin && (
                <button onClick={() => remove(f.id)}
                  className="rounded-full px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-500/10">Delete</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Payments({ institutionId, isAdmin, onChange }: { institutionId: string; isAdmin: boolean; onChange: () => void }) {
  const [payments, setPayments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({
    student_id: "", fee_structure_id: "", fee_name: "",
    amount: 0, paid_amount: 0, payment_method: "cash",
    transaction_id: "", month: "", year: new Date().getFullYear(), note: "",
  });
  const [receiptId, setReceiptId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [pRes, sRes, fRes] = await Promise.all([
      supabase.from("fee_payments")
        .select("*, students:student_id(full_name, student_id, roll_number)")
        .eq("institution_id", institutionId)
        .order("created_at", { ascending: false }).limit(100),
      supabase.from("students").select("id, full_name, student_id, class_id")
        .eq("institution_id", institutionId).order("full_name"),
      supabase.from("fee_structures").select("id, name, amount").eq("institution_id", institutionId).eq("is_active", true),
    ]);
    setPayments(pRes.data ?? []);
    setStudents(sRes.data ?? []);
    setStructures(fRes.data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [institutionId]);

  const onStructChange = (id: string) => {
    const s = structures.find((x) => x.id === id);
    if (s) setForm({ ...form, fee_structure_id: id, fee_name: s.name, amount: Number(s.amount) });
    else setForm({ ...form, fee_structure_id: "", fee_name: "", amount: 0 });
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_id || form.amount <= 0) return;
    setSaving(true); setErr("");
    const status = form.paid_amount >= form.amount ? "paid"
      : form.paid_amount > 0 ? "partial" : "pending";
    const { error } = await supabase.from("fee_payments").insert({
      institution_id: institutionId,
      student_id: form.student_id,
      fee_structure_id: form.fee_structure_id || null,
      fee_name: form.fee_name.trim() || null,
      amount: form.amount,
      paid_amount: form.paid_amount,
      status,
      payment_method: form.payment_method,
      transaction_id: form.transaction_id.trim() || null,
      month: form.month || null,
      year: form.year,
      paid_date: form.paid_amount > 0 ? new Date().toISOString().split("T")[0] : null,
      note: form.note.trim() || null,
    });
    if (error) { setErr(error.message); setSaving(false); return; }
    setForm({ student_id: "", fee_structure_id: "", fee_name: "", amount: 0, paid_amount: 0, payment_method: "cash", transaction_id: "", month: "", year: new Date().getFullYear(), note: "" });
    setShowForm(false); setSaving(false); await load(); onChange();
  };

  const markPaid = async (id: string, amount: number) => {
    await supabase.from("fee_payments").update({
      paid_amount: amount, status: "paid", paid_date: new Date().toISOString().split("T")[0],
    }).eq("id", id);
    await load(); onChange();
  };

  const filtered = filter === "all" ? payments : payments.filter((p) => p.status === filter);

  const statusMeta = (s: string) => ({
    paid:    { label: "Paid",    cls: "bg-emerald-500/15 text-emerald-700" },
    partial: { label: "Partial", cls: "bg-amber-500/15 text-amber-700" },
    pending: { label: "Pending", cls: "bg-slate-500/10 text-slate-600" },
    overdue: { label: "Overdue", cls: "bg-rose-500/15 text-rose-700" },
    waived:  { label: "Waived",  cls: "bg-slate-500/10 text-slate-500" },
  } as any)[s] ?? { label: s, cls: "" };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          className="rounded-full border px-3 py-1.5 text-[12px] outline-none"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <option value="all">All</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
        </select>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)}
            className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow">
            {showForm ? "Cancel" : "+ Record Payment"}
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <form onSubmit={add} className="mb-4 rounded-2xl border p-4 space-y-3"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Student *</label>
              <select required value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <option value="">— Select —</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name}{s.student_id ? " · " + s.student_id : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Fee Plan</label>
              <select value={form.fee_structure_id} onChange={(e) => onStructChange(e.target.value)}
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <option value="">Custom</option>
                {structures.map((s) => <option key={s.id} value={s.id}>{s.name} · ৳{s.amount}</option>)}
              </select>
            </div>
            {!form.fee_structure_id && (
              <div className="sm:col-span-2">
                <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Fee Name</label>
                <input type="text" value={form.fee_name} onChange={(e) => setForm({ ...form, fee_name: e.target.value })}
                  placeholder="Exam Fee"
                  className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
              </div>
            )}
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Total Amount (৳) *</label>
              <input type="number" required min="1" value={form.amount}
                onChange={(e) => setForm({ ...form, amount: parseInt(e.target.value) || 0 })}
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Paid Amount (৳)</label>
              <input type="number" min="0" value={form.paid_amount}
                onChange={(e) => setForm({ ...form, paid_amount: parseInt(e.target.value) || 0 })}
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Payment Method</label>
              <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.emoji} {m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Transaction ID</label>
              <input type="text" value={form.transaction_id} onChange={(e) => setForm({ ...form, transaction_id: e.target.value })}
                placeholder="TRX123..."
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none font-mono"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>
            <div>
              <label className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Month</label>
              <input type="text" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })}
                placeholder="January"
                className="mt-1 w-full rounded-xl border px-3.5 py-2 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            </div>
          </div>
          {err && <div className="text-[12px] text-rose-600">{err}</div>}
          <button type="submit" disabled={saving}
            className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-2 text-[13px] font-semibold text-white disabled:opacity-50">
            {saving ? "Saving..." : "Record Payment"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-10 text-[13px]" style={{ color: "var(--text-muted)" }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="text-[36px]">💳</div>
          <div className="mt-2 text-[14px] font-semibold">No payments</div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => {
            const sm = statusMeta(p.status);
            return (
              <div key={p.id} className="rounded-2xl border p-3 flex items-center justify-between gap-3"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold truncate">{p.students?.full_name}</div>
                  <div className="flex flex-wrap gap-2 mt-0.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
                    <span>{p.fee_name || "Fee"}</span>
                    {p.month && <span>· {p.month} {p.year}</span>}
                    {p.payment_method && <span>· {p.payment_method}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[13px] font-bold">৳{Number(p.paid_amount).toLocaleString()}<span className="text-[11px] font-normal" style={{ color: "var(--text-muted)" }}>/{Number(p.amount).toLocaleString()}</span></div>
                  <span className={"inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-semibold " + sm.cls}>{sm.label}</span>
                </div>
                <div className="flex gap-1">
                  {(p.status === "paid" || p.status === "partial") && (
                    <button onClick={() => setReceiptId(p.id)}
                      className="rounded-full border px-2 py-1 text-[11px] font-medium"
                      style={{ borderColor: "var(--border)" }}>🧾</button>
                  )}
                  {isAdmin && p.status !== "paid" && p.status !== "waived" && (
                    <button onClick={() => markPaid(p.id, Number(p.amount))}
                      className="rounded-full bg-emerald-500/15 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                      Paid
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {receiptId && <FeeReceipt paymentId={receiptId} onClose={() => setReceiptId(null)} />}
    </div>
  );
}
