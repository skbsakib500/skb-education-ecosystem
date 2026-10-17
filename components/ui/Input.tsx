"use client";

import {
  forwardRef,
  InputHTMLAttributes,
  ReactNode,
  useId,
} from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
  error?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(
    {
      label,
      helper,
      error,
      iconLeft,
      iconRight,
      className,
      id: idProp,
      required,
      ...props
    },
    ref
  ) {
    const autoId = useId();
    const id = idProp || autoId;
    const describedBy = error
      ? `${id}-error`
      : helper
      ? `${id}-helper`
      : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-fluid-body-sm font-medium text-fg"
          >
            {label}
            {required && (
              <span className="text-danger ml-0.5" aria-hidden>
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          {iconLeft && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none">
              {iconLeft}
            </span>
          )}

          <input
            ref={ref}
            id={id}
            required={required}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            className={cn(
              "w-full h-11 rounded-lg bg-surface-solid border text-fg",
              "placeholder:text-fg-subtle px-3.5 text-fluid-body",
              "transition-colors duration-fast",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              iconLeft && "pl-10",
              iconRight && "pr-10",
              error
                ? "border-danger focus-visible:ring-danger focus-visible:border-danger"
                : "border-border hover:border-border-strong",
              className
            )}
            {...props}
          />

          {iconRight && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted">
              {iconRight}
            </span>
          )}
        </div>

        {error ? (
          <p id={`${id}-error`} className="text-fluid-caption text-danger">
            {error}
          </p>
        ) : helper ? (
          <p id={`${id}-helper`} className="text-fluid-caption text-fg-subtle">
            {helper}
          </p>
        ) : null}
      </div>
    );
  }
);
