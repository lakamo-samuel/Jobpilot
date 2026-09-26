import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-[6px] border px-2 py-0.5 text-[12px] font-[500] leading-[16px] whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "border-[var(--app-line)] bg-[var(--app-subtle)] text-[var(--app-secondary)]",
        success: "border-[var(--app-line)] bg-[var(--app-subtle)] text-[var(--app-secondary)]",
        warning: "border-[var(--app-line)] bg-[var(--app-subtle)] text-[var(--app-secondary)]",
        danger: "border-[var(--app-danger)] bg-[var(--app-danger-subtle)] text-[var(--app-danger)]",
        info: "border-[var(--app-line)] bg-[var(--app-subtle)] text-[var(--app-secondary)]",
        brand: "border-[var(--app-line)] bg-[var(--app-subtle)] text-[var(--app-secondary)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
