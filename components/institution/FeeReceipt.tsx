"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function FeeReceipt({
  paymentId, onClose,
}: { paymentId: string; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from("fee_payments")
        .select("*, students:student_id(*), institutions:institution_id(*)")
        .eq("id", paymentId).single();
      setData(p);
      setLoading(false);
    })();
  }, [paymentId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-white rounded-2xl p-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!data) return null;
  const receiptNo = "SKB-" + data.id.slice(0, 8).toUpperCase();
  const due = Number(data.amount) - Number(data.paid_amount);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur p-4 overflow-y-auto">
      <div className="w-full max-w-2xl my-8">
        <div className="flex justify-end mb-3 gap-2">
          <button onClick={() => window.print()}
            className="rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-emerald-700 shadow">
            🖨️ Print / Save PDF
          </button>
          <button onClick={onClose}
            className="rounded-full bg-white/20 backdrop-blur px-4 py-2 text-[13px] font-medium text-white">✕ Close</button>
        </div>

        <div id="fee-receipt" className="rounded-2xl bg-white p-8 shadow-2xl text-black">
          {/* Header */}
          <div className="flex items-start justify-between pb-5 border-b-2 border-emerald-600">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-[28px] overflow-hidden">
                {data.institutions?.logo_url
                  ? <img src={data.institutions.logo_url} alt="" className="h-full w-full object-cover" />
                  : (data.institutions?.emoji || "🏫")}
              </div>
              <div>
                <div className="text-[20px] font-bold">{data.institutions?.name || "Institution"}</div>
                {data.institutions?.contact_phone && (
                  <div className="text-[11px] text-gray-600 mt-0.5">📞 {data.institutions.contact_phone}</div>
                )}
                {data.institutions?.contact_email && (
                  <div className="text-[11px] text-gray-600">✉️ {data.institutions.contact_email}</div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-emerald-700 tracking-widest">Fee Receipt</div>
              <div className="text-[11px] text-gray-500 mt-1 font-mono">{receiptNo}</div>
              <div className="text-[10px] text-gray-500">{new Date(data.created_at).toLocaleDateString()}</div>
            </div>
          </div>

          {/* Student */}
          <div className="grid grid-cols-2 gap-4 py-5">
            <Info label="Student Name" value={data.students?.full_name || "—"} />
            <Info label="Student ID" value={data.students?.student_id || "—"} mono />
            <Info label="Roll" value={data.students?.roll_number || "—"} />
            <Info label="Payment Date" value={data.paid_date ? new Date(data.paid_date).toLocaleDateString() : "—"} />
          </div>

          {/* Payment table */}
          <table className="w-full text-[13px] border-collapse mb-5">
            <thead>
              <tr className="bg-emerald-50 border-b-2 border-emerald-200">
                <th className="text-left p-3 font-bold">Description</th>
                <th className="text-right p-3 font-bold">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="p-3">
                  <div className="font-medium">{data.fee_name || "Fee"}</div>
                  <div className="text-[11px] text-gray-500">
                    {data.month && data.month + " "}{data.year || ""}
                  </div>
                </td>
                <td className="p-3 text-right font-semibold">৳{Number(data.amount).toLocaleString()}</td>
              </tr>
              <tr className="border-b border-gray-100 bg-emerald-50/40">
                <td className="p-3 font-semibold">Paid Amount</td>
                <td className="p-3 text-right font-bold text-emerald-700">৳{Number(data.paid_amount).toLocaleString()}</td>
              </tr>
              {due > 0 && (
                <tr className="bg-amber-50/40">
                  <td className="p-3 font-semibold">Due</td>
                  <td className="p-3 text-right font-bold text-amber-700">৳{due.toLocaleString()}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Payment meta */}
          <div className="rounded-xl bg-gray-50 p-4 grid grid-cols-2 gap-3">
            <Info label="Payment Method" value={data.payment_method || "—"} />
            <Info label="Status" value={data.status} />
            {data.transaction_id && <Info label="Transaction ID" value={data.transaction_id} mono />}
          </div>

          {/* Signature */}
          <div className="mt-10 pt-4 grid grid-cols-2 gap-8">
            <div className="border-t border-gray-400 pt-1 text-center text-[10px] text-gray-500">
              Received By
            </div>
            <div className="border-t border-gray-400 pt-1 text-center text-[10px] text-gray-500">
              Authorized Signature
            </div>
          </div>

          <div className="mt-4 text-center text-[9px] text-gray-400">
            Computer generated receipt · SKB Education Ecosystem
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #fee-receipt, #fee-receipt * { visibility: visible; }
          #fee-receipt { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase font-bold text-gray-500">{label}</div>
      <div className={"text-[13px] font-semibold text-gray-900 mt-0.5 " + (mono ? "font-mono" : "")}>{value}</div>
    </div>
  );
}
