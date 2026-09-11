import { useState } from "react";
import { Textarea } from "@/components/ui/Textarea";
import type { WorkflowActions } from "@/hooks/useWorkflow";
import { completeness, type SectionCheck } from "@/lib/checks";
import { cn } from "@/lib/utils";
import { JsonTab } from "./JsonTab";

type Tab = "brief" | "raw" | "json";
const TABS: { id: Tab; label: string }[] = [
  { id: "brief", label: "Brief" },
  { id: "raw", label: "Rå tekst" },
  { id: "json", label: "Lagret data (JSON)" },
];

/** Over dette antallet linjer rendres briefen som én tekstnode, så en stor import ikke henger fanen. */
const MAX_COLORED_LINES = 2000;

type Props = {
  brief: string;
  checks: SectionCheck[];
  actions: Pick<WorkflowActions, "workflow" | "replace">;
  backup: string | null;
  onImported: () => void;
};

/** Fargelegger overskrifter og skillelinjer i briefen uten å tolke Markdown. */
function BriefLine({ line }: { line: string }) {
  if (/^#+ /.test(line)) return <span className="font-medium text-code-heading">{line}</span>;
  if (/^(---|\|---)/.test(line)) return <span className="text-code-dim">{line}</span>;
  return <>{line}</>;
}

export function PreviewPanel({ brief, checks, actions, backup, onImported }: Props) {
  const [tab, setTab] = useState<Tab>("brief");
  const pct = completeness(checks);
  const missing = checks.filter((c) => c.status !== "done");
  const briefLines = brief.split("\n");

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Brief til Claude</h2>
        <div className="flex items-center gap-2.5 text-sm text-secondary-foreground">
          <span className="tabular-nums">{pct} % komplett</span>
          <div
            className="h-2 w-[120px] overflow-hidden rounded-full bg-subtle"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Hvor komplett briefen er"
          >
            <div className="h-full bg-primary transition-[width]" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5" aria-live="polite">
        {actions.workflow.eksempel && (
          <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11.5px] font-semibold text-primary">Eksempel, ikke dine data</span>
        )}
        {missing.length ? (
          missing.map((m) => (
            <span key={m.id} className="rounded-full bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning">
              Mangler: {m.label}
            </span>
          ))
        ) : (
          <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-medium text-success">Alt på plass. Klar for Claude.</span>
        )}
      </div>

      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "min-h-11 border-b-2 border-transparent px-3 py-2 text-secondary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              tab === t.id && "border-primary font-semibold text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "brief" && (
        <pre
          id="brief"
          tabIndex={0}
          aria-label="Brief til Claude, kan rulles"
          className="m-0 max-h-[70vh] min-h-80 overflow-auto rounded-md bg-code p-5 font-mono text-[12.5px] leading-[1.55] wrap-break-word whitespace-pre-wrap text-code-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {briefLines.length > MAX_COLORED_LINES
            ? brief
            : briefLines.map((line, i) => (
                <span key={i}>
                  <BriefLine line={line} />
                  {"\n"}
                </span>
              ))}
        </pre>
      )}
      {tab === "raw" && (
        <Textarea
          readOnly
          maxLength={undefined}
          aria-label="Brief som ren tekst"
          className="min-h-80 font-mono text-[12.5px]"
          value={brief}
          onFocus={(e) => e.target.select()}
        />
      )}
      {tab === "json" && <JsonTab actions={actions} backup={backup} onImported={onImported} />}

      <p className="m-0 text-xs text-muted-foreground">
        Lim briefen inn i Claude sammen med setningen «Bygg en MVP av denne flyten». Flyten lagres bare i denne nettleseren.
        Bruk JSON-fanen for å dele den med en kollega.
      </p>
    </div>
  );
}
