import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "accent" | "outline";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-gradient-primary text-white shadow-sm motion-safe:hover:shadow-glow",
  accent:
    "bg-gradient-accent text-white shadow-sm motion-safe:hover:shadow-glow",
  outline:
    "border border-border bg-card text-foreground shadow-sm motion-safe:hover:border-primary/40 motion-safe:hover:bg-primary/5",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

/**
 * Shared button primitive — centralizes the touch-target size (min 44px,
 * DESIGN.md §8) and focus-visible ring that were previously duplicated
 * (and inconsistently applied) across ~15 individual button instances.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", type, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type ?? "button"}
        className={`ease-spring flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm ${VARIANT_CLASSES[variant]} ${className}`}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
