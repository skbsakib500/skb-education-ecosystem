"use client";

import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onEsc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = prev;
    };
  }, [open, onCancel]);

  if (!open) return null;

  const confirmClass =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700 text-white"
      : "bg-accent hover:bg-accent-hover text-white";

  const iconClass =
    variant === "danger"
      ? "bg-red-100 text-red-600"
      : "bg-canvas-soft text-fg-muted";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-2xl bg-surface-solid shadow-2xl animate-in fade-in zoom-in-95"
      >
        <div className="flex items-start gap-3 p-5">
          <div
            className={cn(
              "shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
              iconClass
            )}
          >
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-fluid-h3 font-semibold text-fg">{title}</h3>
            {message && <p className="mt-1 text-fluid-body-sm text-fg-muted">{message}</p>}
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg hover:bg-surface-hover"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-border bg-canvas-soft rounded-b-2xl">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-fluid-body-sm font-medium text-fg hover:bg-surface-hover disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "px-4 py-2 rounded-lg text-fluid-body-sm font-semibold disabled:opacity-50",
              confirmClass
            )}
          >
            {loading ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
