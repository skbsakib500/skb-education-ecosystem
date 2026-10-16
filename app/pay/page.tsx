"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export default function Page() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>}><PayView /></Suspense>;
}

function PayView() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [link, setLink] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [inst, setInst] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [gateway, setGateway] = useState<"bkash"|"nagad"|"manual">("bkash");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login/?next=/pay/?token=" + token); return; }
    if (!user || !token) return;
    (async () => {
      const { data: pl } = await supabase.from("payment_links")
        .select("*, students:student_id(full_name, student_id), institutions:institution_id(name, emoji, logo_url)")
        .eq("token", token).maybeSingle();
      if (!pl) { setError("Invalid or expired link"); setLoading(false); return; }
      setLink(pl);
      setStudent(pl.students);
      setInst(pl.institutions);
      setLoading(false);
    })();
  }, [user, token, authLoading, router]);

  const payNow = async () => {
    if (!user || !link) return;
    setSubmitting(true); setError("");

    // Create pending transaction (gateway integration needed for real money)
    const { data: txn, error: txnErr } = await supabase.from("payment_transactions").insert({
      institution_id: link.institution_id,
      student_id: link.student_id,
      fee_payment_id: link.fee_payment_id,
      amount: link.amount,
      gateway: gateway,
      status: "pending",
      initiator_user_id: user.id,
    }).select().single();

    if (txnErr) { setError(txnErr.message); setSubmitting(false); return; }

    // For demo: mark as manual success (real integration: redirect to gateway)
    if (gateway === "manual") {
      const { data: result, error: confirmErr } = await supabase.rpc("confirm_payment", {
        p_txn_id: txn.id, p_gateway_txn_id: null, p_response: { source: "manual" },
      });
      if (confirmErr) { setError(confirmErr.message); setSubmitting(false); return; }
      setDone({ receipt: (result as any).receipt_no, txn_id: txn.id });
    } else {
      // Simulate gateway - real integration goes here
      setTimeout(async () => {
        const { data: result } = await supabase.rpc("confirm_payment", {
          p_txn_id: txn.id,
          p_gateway_txn_id: gateway.toUpperCase() + "-" + Math.random().toString(36).slice(2, 10).toUpperCase(),
          p_response: { gateway, simulated: true },
        });
        setDone({ receipt: (result as any).receipt_no, txn_id: txn.id });
        setSubmitting(false);
      }, 1500);
      return;
    }
    setSubmitting(false);
  };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>;

  if (error && !link) return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md rounded-3xl border p-8" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
        <div className="text-[48px]">❌</div>
        <div className="mt-3 text-[16px] font-semibold">Invalid link</div>
        <div className="mt-2 text-[13px]" style={{ color: "var(--text-muted)" }}>{error}</div>
        <Link href="/hub" className="mt-5 inline-block rounded-full border px-5 py-2 text-[13px]" style={{ borderColor: "var(--border)" }}>Go to Hub</Link>
      </div>
    </main>
  );

  if (done) return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="text-center max-w-md w-full rounded-3xl border p-8" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
        <div className="text-[56px]">🎉</div>
        <div className="mt-3 text-[18px] font-semibold">Payment Successful!</div>
        <div className="bangla text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>পেমেন্ট সফল হয়েছে</div>

        <div className="mt-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white">
          <div className="text-[12px] opacity-90">Amount Paid</div>
          <div className="text-[32px] font-bold">৳{Number(link.amount).toLocaleString()}</div>
          <div className="text-[11px] mt-2 font-mono opacity-90">Receipt: {done.receipt}</div>
        </div>

        <div className="mt-4 text-[12px]" style={{ color: "var(--text-muted)" }}>
          A confirmation email/sms has been sent to you
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <Link href="/hub" className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 py-2.5 text-[13px] font-semibold text-white shadow">Done →</Link>
        </div>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Link href="/hub" className="text-[13px]" style={{ color: "var(--text-muted)" }}>← Hub</Link>

        <div className="mt-4 rounded-3xl border overflow-hidden" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          {/* Institution header */}
          <div className="p-5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur text-[24px] overflow-hidden">
                {inst?.logo_url ? <img src={inst.logo_url} alt="" className="h-full w-full object-cover" /> : (inst?.emoji || "🏫")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold truncate">{inst?.name}</div>
                <div className="text-[11px] opacity-90">Payment Request</div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Student</div>
              <div className="text-[16px] font-semibold mt-1">{student?.full_name}</div>
              <div className="text-[12px] font-mono" style={{ color: "var(--text-muted)" }}>🆔 {student?.student_id}</div>
            </div>

            <div className="rounded-2xl border p-5 text-center" style={{ borderColor: "var(--border)" }}>
              <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Amount Due</div>
              <div className="text-[36px] font-bold mt-1 text-emerald-600">৳{Number(link.amount).toLocaleString()}</div>
              {link.note && <div className="text-[12px] mt-2" style={{ color: "var(--text-muted)" }}>{link.note}</div>}
            </div>

            <div>
              <div className="text-[12px] font-medium mb-2" style={{ color: "var(--text-muted)" }}>Choose payment method</div>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { k: "bkash" as const, l: "bKash", e: "🟣" },
                  { k: "nagad" as const, l: "Nagad", e: "🟠" },
                  { k: "manual" as const, l: "Manual", e: "💵" },
                ]).map((g) => (
                  <button key={g.k} onClick={() => setGateway(g.k)}
                    className={"rounded-xl border p-3 text-center transition " + (gateway === g.k ? "bg-emerald-500/15 border-emerald-500/40" : "")}
                    style={gateway !== g.k ? { borderColor: "var(--border)" } : {}}>
                    <div className="text-[22px]">{g.e}</div>
                    <div className="text-[11px] font-semibold mt-1">{g.l}</div>
                  </button>
                ))}
              </div>
            </div>

            {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-[12px] text-rose-700">{error}</div>}

            <button onClick={payNow} disabled={submitting}
              className="w-full rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 py-3.5 text-[15px] font-bold text-white shadow-lg disabled:opacity-50">
              {submitting ? "Processing..." : "🔒 Pay ৳" + Number(link.amount).toLocaleString()}
            </button>

            <div className="text-center text-[11px]" style={{ color: "var(--text-faint)" }}>
              🔒 Secured by SKB Education Ecosystem
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
