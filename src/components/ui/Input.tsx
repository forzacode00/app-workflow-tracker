import type { InputHTMLAttributes } from "react";
import { SHORT } from "@/lib/types";
import { cn } from "@/lib/utils";

export const fieldClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

/** Tekstfelt. Standard maks-lengde er den samme som zod-skjemaet bruker for korte felt. */
export function Input({ className, type = "text", maxLength = SHORT, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input type={type} maxLength={maxLength} className={cn(fieldClass, "min-h-11", className)} {...props} />;
}
