"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PaymentLinkButton({
  institutionId, studentId, feePaymentId, amount, feeName,
}: { institutionId: string; studentId: string; feePaymentId: string | null; amount: number; feeName?: string }) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const create = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("create_payment_link", {
      p_institution_id: institutionId,
      p_student_id: studentId,
      p_fee_payment_id: feePaymentId,
      p_amount: amount,
      p_note: feeName || null,
    });
    setLoading(false);
    if (error) { alert(error.message); return; }
    await navigator.clipboard.writeText((data as any).url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    alert("✅ Payment link copied!\n\n" + (data as any).url);
  };

  return (
    <button onClick={create} disabled={loading}
      className="rounded-full bg-cyan-500/15 px-2 py-1 text-[10px] font-semibold text-cyan-700 disabled:opacity-50"
      title="Copy payment link">
      {loading ? "..." : copied ? "✓ Copied" : "🔗 Pay Link"}
    </button>
  );
}
