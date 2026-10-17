"use client";

import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type DialogSize = "sm" | "md" | "lg";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: DialogSize;
  closeOnBackdrop?: boolean;
}

const sizeClasses: Record<DialogSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  closeOnBackdrop = true,
}: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "dialog-title" : undefined}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full rounded-xl bg-surface-solid border border-border shadow-elevation-4",
          sizeClasses[size]
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-3 p-5 border-b border-border">
            <div className="min-w-0">
              {title && (
                <h2
                  id="dialog-title"
                  className="text-fluid-h3 font-semibold text-fg"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-fluid-body-sm text-fg-muted mt-1">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-fg-muted hover:bg-surface-hover transition-colors duration-fast"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {children && <div className="p-5">{children}</div>}

        {footer && (
          <div className="p-5 pt-0 flex flex-wrap justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
