"use client";

import { forwardRef, ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-fg hover:bg-accent-hover shadow-elevation-1",
  secondary:
    "bg-surface-solid text-fg border border-border-strong hover:bg-surface-hover",
  outline:
    "bg-transparent text-fg border border-border-strong hover:bg-surface-hover",
  ghost: "bg-transparent text-fg hover:bg-surface-hover",
  danger:
    "bg-danger text-white hover:opacity-90 shadow-elevation-1",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-fluid-body-sm gap-1.5",
  md: "h-11 px-5 text-fluid-body gap-2",
  lg: "h-12 px-7 text-fluid-body gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading,
      iconLeft,
      iconRight,
      fullWidth,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-semibold",
          "transition-[background-color,color,box-shadow] duration-fast ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
          "disabled:opacity-50 disabled:pointer-events-none",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" aria-hidden />
        ) : (
          iconLeft
        )}
        {children}
        {!loading && iconRight}
      </button>
    );
  }
);
