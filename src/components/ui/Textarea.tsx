import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { fieldClass } from "./Input";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldClass, "min-h-20 resize-y leading-snug", className)} {...props} />;
}
