import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { fieldClass } from "./Input";

type Props<T extends string> = Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange"> & {
  options: readonly T[];
  value: T | "";
  onValueChange: (value: T | "") => void;
  placeholder?: string;
};

/** Nedtrekksliste som bare slipper gjennom verdier fra `options`. Alt annet blir tom streng. */
export function Select<T extends string>({ className, options, value, onValueChange, placeholder = "Velg", ...props }: Props<T>) {
  return (
    <select
      className={cn(fieldClass, "min-h-11", className)}
      value={value}
      onChange={(e) => {
        const next = e.target.value as T;
        onValueChange(options.includes(next) ? next : "");
      }}
      {...props}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
