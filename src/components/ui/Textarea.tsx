import type { TextareaHTMLAttributes } from "react";
import { LONG } from "@/lib/types";
import { cn } from "@/lib/utils";
import { fieldClass } from "./Input";

/** Flerlinjet felt. Standard maks-lengde er den samme som zod-skjemaet bruker for lange felt. */
export function Textarea({ className, maxLength = LONG, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea maxLength={maxLength} className={cn(fieldClass, "min-h-20 resize-y leading-snug", className)} {...props} />;
}
