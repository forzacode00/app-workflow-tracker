import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: string };

/** Avkrysningsboks med ledetekst og 44 px trykkflate. */
export function Checkbox({ className, label, ...props }: Props) {
  return (
    <label className={cn("flex min-h-11 cursor-pointer items-center gap-2 text-sm text-secondary-foreground", className)}>
      <input
        type="checkbox"
        className="size-[18px] accent-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        {...props}
      />
      {label}
    </label>
  );
}
