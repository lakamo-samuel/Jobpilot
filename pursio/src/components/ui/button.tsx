import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[8px] text-[14px] font-[600] leading-[21px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--app-action)] focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--app-action)] text-[var(--app-on-action)] hover:bg-[var(--app-action-hover)] active:bg-[var(--app-action-hover)]",
        secondary:
          "border border-[var(--app-line)] bg-[var(--app-surface)] text-[var(--app-ink)] hover:bg-[var(--app-subtle)] hover:text-[var(--app-action)]",
        ghost:
          "bg-transparent text-[var(--app-secondary)] hover:bg-[var(--app-subtle)] hover:text-[var(--app-ink)]",
        destructive:
          "bg-[var(--app-danger)] text-[var(--app-surface)] hover:opacity-90 active:opacity-80",
        "destructive-outline":
          "border border-[var(--app-danger)] text-[var(--app-danger)] hover:bg-[var(--app-danger-subtle)]",
        brand:
          "bg-[var(--app-subtle)] text-[var(--app-action)] hover:bg-[var(--app-subtle)]",
      },
      size: {
        default: "h-10 px-4",
        lg: "h-[40px] px-5",
        sm: "h-9 px-3 text-[13px]",
        icon: "h-10 w-10 p-0",
        "icon-sm": "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>{children}</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
