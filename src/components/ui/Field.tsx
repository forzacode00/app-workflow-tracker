import type { ReactNode } from "react";

type Props = {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
};

/** Ledetekst over et skjemafelt. Barnet må bruke samme `id`. */
export function Field({ id, label, hint, children }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-secondary-foreground">
        {label}
      </label>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}
