import type { ButtonHTMLAttributes, Ref } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost" | "danger";
type Size = "default" | "sm";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground border-primary hover:brightness-105",
  outline: "bg-card text-foreground border-input hover:bg-subtle",
  ghost: "bg-transparent text-secondary-foreground border-transparent hover:bg-subtle",
  danger: "bg-transparent text-destructive border-transparent hover:bg-subtle",
};

/* Minst 44 px trykkflate på mobil. Liten variant krymper først fra sm-bruddpunktet. */
const SIZES: Record<Size, string> = {
  default: "min-h-11 px-4 py-2",
  sm: "min-h-11 px-3 py-1.5 text-sm sm:min-h-9",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; ref?: Ref<HTMLButtonElement> };

export function Button({ className, variant = "outline", size = "default", type = "button", ref, ...props }: Props) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-md border font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
}
