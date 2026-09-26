import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  hint?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, label, hint, id, ...props }, ref) => {
    // Hooks must run on every render, even when the caller supplies an id.
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[14px] font-[600] leading-[21px] text-[var(--app-ink)]"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={cn(error ? errorId : undefined, hint ? hintId : undefined)}
          className={cn(
            "h-[36px] w-full rounded-[8px] border border-[var(--app-line)] bg-[var(--app-surface)] px-3 text-[14px] leading-[21px] text-[var(--app-ink)] placeholder:text-[var(--app-muted)]",
            "transition-colors hover:border-[var(--app-line-strong)]",
            "focus:outline focus:outline-2 focus:outline-[var(--app-action)] focus:outline-offset-0 focus:border-transparent",
            "disabled:cursor-not-allowed disabled:bg-[var(--app-subtle)] disabled:text-[var(--app-muted)]",
            error && "border-[var(--app-danger)] focus:outline-[var(--app-danger)]",
            className
          )}
          {...props}
        />
        {hint && !error && (
          <p id={hintId} className="text-[13px] leading-[18px] text-[var(--app-muted)]">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-[13px] leading-[18px] text-[var(--app-danger)]">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
