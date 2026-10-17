import { forwardRef, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type CardVariant = "surface" | "flat" | "elevated";
type CardPadding = "none" | "sm" | "md" | "lg";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  interactive?: boolean;
}

const variantClasses: Record<CardVariant, string> = {
  surface: "bg-surface-solid border border-border",
  flat: "bg-canvas-soft border border-border",
  elevated:
    "bg-surface-solid border border-border shadow-elevation-2",
};

const paddingClasses: Record<CardPadding, string> = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = "surface", padding = "md", interactive, className, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl transition-all duration-base ease-out",
        variantClasses[variant],
        paddingClasses[padding],
        interactive &&
          "hover:-translate-y-0.5 hover:shadow-elevation-3 cursor-pointer",
        className
      )}
      {...props}
    />
  );
});

export const CardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function CardHeader({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn("mb-3 flex items-start justify-between gap-3", className)}
      {...props}
    />
  );
});

export const CardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(function CardTitle({ className, ...props }, ref) {
  return (
    <h3
      ref={ref}
      className={cn("text-fluid-h3 font-semibold text-fg", className)}
      {...props}
    />
  );
});

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(function CardDescription({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      className={cn("text-fluid-body-sm text-fg-muted", className)}
      {...props}
    />
  );
});
