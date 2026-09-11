import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { fieldClass } from "./Input";

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange"> & {
  options: readonly Option<T>[];
  value: T;
  onValueChange: (value: T) => void;
};

/** Nedtrekksliste som bare slipper gjennom verdier fra `options`. */
export function Select<T extends string>({ className, options, value, onValueChange, ...props }: Props<T>) {
  return (
    <select
      className={cn(fieldClass, "min-h-11", className)}
      value={value}
      onChange={(e) => {
        const next = options.find((o) => o.value === e.target.value);
        if (next) onValueChange(next.value);
      }}
      {...props}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
