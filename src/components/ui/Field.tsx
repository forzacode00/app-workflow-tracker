import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  label: string;
  hint?: string;
  /** Mindre ledetekst, til felt inne i listerader. */
  compact?: boolean;
  children: ReactNode;
};

/** Synlig ledetekst over et skjemafelt. Barnet må bruke samme `id`. */
export function Field({ id, label, hint, compact = false, children }: Props) {
  return (
    <div className={cn("flex flex-col", compact ? "gap-1" : "gap-1.5")}>
      <label htmlFor={id} className={cn("font-semibold text-secondary-foreground", compact ? "text-xs" : "text-sm")}>
        {label}
      </label>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}
