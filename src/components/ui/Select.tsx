import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { fieldClass } from "./Input";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  options: readonly string[];
  placeholder?: string;
};

export function Select({ className, options, placeholder = "Velg", ...props }: Props) {
  return (
    <select className={cn(fieldClass, "min-h-11", className)} {...props}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
