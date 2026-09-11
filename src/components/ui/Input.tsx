import type { InputHTMLAttributes, Ref } from "react";
import { SHORT } from "@/lib/flow";
import { cn } from "@/lib/utils";

export const fieldClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

type Props = InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> };

/**
 * Tekstfelt. Standard maks-lengde er den samme som skjemaet bruker for korte felt.
 * Send `maxLength={undefined}` eksplisitt for et felt uten grense.
 */
export function Input({ className, type = "text", ref, ...props }: Props) {
  const maxLength = "maxLength" in props ? props.maxLength : SHORT;
  return <input ref={ref} type={type} {...props} maxLength={maxLength} className={cn(fieldClass, "min-h-11", className)} />;
}
