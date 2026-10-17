"use client";

import { useState } from "react";
import { Flag, X, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

const REASONS = [
  { v: "harassment",      l: "Harassment or bullying" },
  { v: "spam",            l: "Spam or scam" },
  { v: "hate",            l: "Hate speech" },
  { v: "explicit",        l: "Sexual or explicit content" },
  { v: "violence",        l: "Violence or threats" },
  { v: "misinformation",  l: "False information" },
  { v: "other",           l: "Other" },
];

export default function ReportButton({
  contentType,
  contentId,
  variant = "icon",
}: {
  contentType: "post" | "comment" | "discussion" | "discussion_answer" | "profile";
  contentId: string;
  variant?: "icon" | "text";
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("harassment");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const submit = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("submit_report", {
      p_content_type: contentType,
      p_content_id: contentId,
      p_reason: reason,
      p_description: description.trim() || null,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data?.status === "already_reported") {
      toast.info("You have already reported this");
    } else {
      toast.success("Report submitted — we will review it");
    }
    setOpen(false);
    setDescription("");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          variant === "icon"
            ? "p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
            : "inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
        }
        title="Report"
        aria-label="Report"
      >
        <Flag size={variant === "icon" ? 14 : 12} />
        {variant === "text" && "Report"}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start gap-3 p-5 border-b border-slate-100">
              <div className="shrink-0 w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                <Flag size={18} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-slate-900">Report content</h3>
                <p className="text-xs text-slate-500 mt-0.5">Help us keep SKB safe for everyone</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-slate-100" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Reason</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  {REASONS.map((r) => <option key={r.v} value={r.v}>{r.l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Details <span className="text-slate-400">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="What is wrong with this content?"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">{description.length}/500</p>
              </div>
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle size={13} className="shrink-0 mt-0.5" />
                <span>False reports may lead to account restrictions.</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50/60 rounded-b-2xl">
              <button onClick={() => setOpen(false)} disabled={loading} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50">
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {loading ? "Submitting…" : "Submit report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
