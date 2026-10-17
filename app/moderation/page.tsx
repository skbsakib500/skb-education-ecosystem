"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Flag, Loader2, Eye, EyeOff, Ban, X, AlertTriangle,
  ShieldCheck, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

type Report = {
  report_id: string;
  content_type: string;
  content_id: string;
  content_preview: string | null;
  reason: string;
  description: string | null;
  status: string;
  reporter_id: string;
  created_at: string;
  content_owner: string | null;
  reporter_count: number;
  content_owner_name: string | null;
};

const TABS = [
  { key: "pending",   label: "Pending" },
  { key: "actioned",  label: "Actioned" },
  { key: "dismissed", label: "Dismissed" },
  { key: "all",       label: "All" },
];

export default function ModerationPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [tab, setTab] = useState("pending");
  const [working, setWorking] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login/");
  }, [user, authLoading, router]);

  const load = async () => {
    const { data, error } = await supabase.rpc("my_moderation_queue");
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    setReports((data as Report[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    supabase.rpc("is_platform_admin").then(({ data }) => {
      const ok = data === true;
      setIsAdmin(ok);
      if (!ok) router.replace("/hub/");
    });
  }, [user, router]);

  useEffect(() => {
    if (isAdmin === true) load();
  }, [isAdmin]);

  const act = async (reportId: string, action: "dismiss" | "hide" | "ban_user") => {
    setWorking(reportId);
    const { error } = await supabase.rpc("admin_review_report", {
      p_report_id: reportId,
      p_action: action,
      p_notes: action === "ban_user" ? "Policy violation" : null,
      p_ban_category: action === "ban_user" ? "warning" : null,
      p_ban_days: action === "ban_user" ? 7 : null,
    });
    setWorking(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(
      action === "dismiss" ? "Report dismissed" :
      action === "hide" ? "Content hidden" :
      "User banned for 7 days + content hidden"
    );
    await load();
  };

  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-3">🔒</div>
          <h1 className="text-lg font-semibold text-fg">Access restricted</h1>
          <p className="mt-1 text-fluid-body-sm text-fg-muted">
            This page is only for platform administrators.
          </p>
          <a href="/hub/" className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-fluid-body-sm font-medium text-white hover:bg-slate-800">
            Back to Hub
          </a>
        </div>
      </div>
    );
  }

  if (authLoading || loading || isAdmin === null) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-24 text-center text-fg-muted text-fluid-body-sm flex items-center justify-center gap-2">
        <Loader2 size={18} className="animate-spin" /> Loading moderation queue…
      </div>
    );
  }

  const filtered = tab === "all" ? reports : reports.filter((r) => r.status === tab);
  const pendingCount = reports.filter((r) => r.status === "pending").length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div>
        <Link href="/super-admin/" className="inline-flex items-center gap-1 text-fluid-body-sm text-fg-muted hover:text-fg">
          <ArrowLeft size={14} /> Super Admin
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-2xl font-bold text-fg">Moderation</h1>
          {pendingCount > 0 && (
            <span className="rounded-full bg-red-100 text-red-700 px-2.5 py-0.5 text-fluid-caption font-bold">
              {pendingCount} pending
            </span>
          )}
        </div>
        <p className="text-fluid-body-sm text-fg-muted mt-1">Review content reports from users</p>
        <Link
          href="/moderation/words/"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border-strong bg-white px-3 py-1.5 text-fluid-body-sm font-medium text-fg hover:bg-canvas-soft mt-3"
        >
          🚫 Manage banned words
        </Link>
      </div>

      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => {
          const count = t.key === "all" ? reports.length : reports.filter((r) => r.status === t.key).length;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={
                "px-4 py-2.5 text-fluid-body-sm font-medium border-b-2 transition -mb-px " +
                (tab === t.key
                  ? "border-emerald-500 text-emerald-700"
                  : "border-transparent text-fg-muted hover:text-fg")
              }
            >
              {t.label}
              <span className="ml-1.5 text-fluid-caption text-fg-subtle">({count})</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-strong bg-white p-10 text-center">
          <ShieldCheck size={32} className="mx-auto text-emerald-500 mb-2" />
          <h2 className="text-base font-semibold text-fg">All clear</h2>
          <p className="mt-1 text-fluid-body-sm text-fg-muted">No reports in this category</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.report_id} className="rounded-2xl border border-border bg-white p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-hover px-2 py-0.5 text-fluid-micro font-semibold uppercase text-fg-muted">
                    {r.content_type}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-fluid-micro font-semibold text-red-700 capitalize">
                    <Flag size={10} /> {r.reason}
                  </span>
                  <span className="text-fluid-caption text-fg-muted">
                    by <strong>{r.content_owner_name || "Unknown"}</strong>
                  </span>
                  {r.reporter_count > 1 && (
                    <span className="text-fluid-caption text-amber-700 font-semibold">
                      {r.reporter_count} reports
                    </span>
                  )}
                  {r.status !== "pending" && (
                    <span className={
                      "rounded-full px-2 py-0.5 text-fluid-micro font-semibold " +
                      (r.status === "actioned" ? "bg-emerald-100 text-emerald-700" : "bg-surface-hover text-fg-muted")
                    }>
                      {r.status}
                    </span>
                  )}
                </div>
                <span className="text-fluid-caption text-fg-subtle shrink-0">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="rounded-xl bg-canvas-soft p-3 text-fluid-body-sm text-fg mb-3 border border-border">
                {r.content_preview || "(no preview available)"}
              </div>

              {r.description && (
                <div className="text-fluid-caption text-fg-muted mb-3">
                  <span className="font-semibold">Reporter note:</span> {r.description}
                </div>
              )}

              {r.status === "pending" && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => act(r.report_id, "dismiss")}
                    disabled={working === r.report_id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong px-3 py-1.5 text-fluid-caption font-medium text-fg hover:bg-canvas-soft disabled:opacity-50"
                  >
                    {working === r.report_id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                    Dismiss
                  </button>
                  <button
                    onClick={() => act(r.report_id, "hide")}
                    disabled={working === r.report_id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-fluid-caption font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                  >
                    <EyeOff size={12} /> Hide content
                  </button>
                  <button
                    onClick={() => act(r.report_id, "ban_user")}
                    disabled={working === r.report_id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-fluid-caption font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    <Ban size={12} /> Ban user (7d)
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
