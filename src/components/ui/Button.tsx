import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost" | "danger";
type Size = "default" | "sm";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground border-primary hover:brightness-105",
  outline: "bg-card text-foreground border-input hover:bg-subtle",
  ghost: "bg-transparent text-secondary-foreground border-transparent hover:bg-subtle",
  danger: "bg-transparent text-destructive border-transparent hover:bg-subtle",
};

const SIZES: Record<Size, string> = {
  default: "min-h-11 px-4 py-2",
  sm: "min-h-9 px-3 py-1.5 text-sm",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size };

export function Button({ className, variant = "outline", size = "default", type = "button", ...props }: Props) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md border font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
}
