import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Props = {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  emoji,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: Props) {
  const ctaClass =
    "inline-block mt-5 rounded-lg bg-accent px-4 py-2 text-fluid-body-sm font-medium text-white hover:bg-accent-hover transition-colors";

  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-border-strong bg-surface-solid p-8 text-center",
        className
      )}
    >
      <div className="mx-auto w-14 h-14 rounded-2xl bg-canvas-soft flex items-center justify-center text-fg-muted mb-4">
        {Icon ? <Icon size={24} /> : <span className="text-2xl">{emoji || "📭"}</span>}
      </div>
      <h3 className="text-fluid-h3 font-semibold text-fg">{title}</h3>
      {description && (
        <p className="mt-1 text-fluid-body-sm text-fg-muted max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && actionHref && (
        <Link href={actionHref} className={ctaClass}>
          {actionLabel}
        </Link>
      )}
      {actionLabel && !actionHref && onAction && (
        <button onClick={onAction} className={ctaClass}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
