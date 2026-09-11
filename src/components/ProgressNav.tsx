import type { CheckStatus, SectionCheck } from "@/lib/checks";
import { cn } from "@/lib/utils";

const STATUS_TEXT: Record<CheckStatus, string> = { done: "ferdig", partial: "påbegynt", empty: "tom" };
const STATUS_CLASS: Record<CheckStatus, string> = {
  done: "border-primary text-foreground",
  partial: "border-warning text-foreground",
  empty: "border-input text-secondary-foreground",
};

export function ProgressNav({ checks }: { checks: SectionCheck[] }) {
  return (
    <nav aria-label="Fremdrift" className="grid grid-cols-4 gap-1.5 md:grid-cols-7">
      {checks.map((c) => (
        <a
          key={c.id}
          href={`#s-${c.id}`}
          className={cn(
            "block min-h-11 border-t-[3px] px-1.5 py-2 text-xs no-underline hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            STATUS_CLASS[c.status],
          )}
        >
          <strong className="block font-semibold">{c.label}</strong>
          {STATUS_TEXT[c.status]}
        </a>
      ))}
    </nav>
  );
}
