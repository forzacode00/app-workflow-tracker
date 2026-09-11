import type { ReactNode } from "react";
import type { SectionId } from "@/lib/checks";

type Props = {
  id: SectionId;
  eyebrow: string;
  title: string;
  why: string;
  action?: ReactNode;
  children: ReactNode;
};

export function StepSection({ id, eyebrow, title, why, action, children }: Props) {
  return (
    <section
      id={`s-${id}`}
      aria-labelledby={`h-${id}`}
      className="flex scroll-mt-3 flex-col gap-3 rounded-md border border-border bg-card p-4 text-card-foreground sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="mb-1 block text-[11px] font-semibold tracking-[0.08em] text-primary uppercase">{eyebrow}</span>
          <h2 id={`h-${id}`} className="text-lg font-bold">
            {title}
          </h2>
        </div>
        {action}
      </div>
      <p className="m-0 max-w-[62ch] text-[13.5px] text-secondary-foreground">{why}</p>
      {children}
    </section>
  );
}
