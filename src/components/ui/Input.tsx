import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const fieldClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

export function Input({ className, type = "text", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input type={type} className={cn(fieldClass, "min-h-11", className)} {...props} />;
}
