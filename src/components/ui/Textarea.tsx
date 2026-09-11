import type { TextareaHTMLAttributes } from "react";
import { LONG } from "@/lib/flow";
import { cn } from "@/lib/utils";
import { fieldClass } from "./Input";

/**
 * Flerlinjet felt. Standard maks-lengde er den samme som skjemaet bruker for lange felt.
 * Send `maxLength={undefined}` eksplisitt for et felt uten grense (f.eks. JSON-import).
 */
export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const maxLength = "maxLength" in props ? props.maxLength : LONG;
  return <textarea {...props} maxLength={maxLength} className={cn(fieldClass, "min-h-20 resize-y leading-snug", className)} />;
}
