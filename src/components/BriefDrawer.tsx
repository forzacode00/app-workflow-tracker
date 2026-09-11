import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import type { FlowActions } from "@/hooks/useFlow";
import { parseFlow, serializeFlow } from "@/lib/flowStorage";
import { cn } from "@/lib/utils";

type Tab = "brief" | "json";

type Props = {
  open: boolean;
  onClose: () => void;
  brief: string;
  questions: number;
  actions: Pick<FlowActions, "flow" | "replace">;
  backup: string | null;
  onCopy: () => void;
  onImported: () => void;
};

const MAX_COLORED_LINES = 2000;

function BriefLine({ line }: { line: string }) {
  if (/^#+ /.test(line)) return <span className="font-medium text-code-heading">{line}</span>;
  if (/^(---)/.test(line)) return <span className="text-code-dim">{line}</span>;
  return <>{line}</>;
}

/** Skuff fra høyre med briefen og JSON for deling. */
export function BriefDrawer({ open, onClose, brief, questions, actions, backup, onCopy, onImported }: Props) {
  const [tab, setTab] = useState<Tab>("brief");
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const jsonValue = draft ?? serializeFlow(actions.flow);
  const importJson = () => {
    const r = parseFlow(jsonValue);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    actions.replace(r.flow);
    setDraft(null);
    setError(null);
    onImported();
  };
  const lines = brief.split("\n");

  return (
    <div className="fixed inset-0 z-30 flex justify-end" role="dialog" aria-modal="true" aria-label="Brief til Claude">
      <button type="button" aria-label="Lukk" className="flex-1 bg-foreground/40" onClick={onClose} />
      <div className="flex w-full max-w-[640px] flex-col gap-3 bg-card p-4 shadow-xl sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Brief til Claude</h2>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={onCopy}>
              Kopier brief
            </Button>
            <Button ref={closeRef} size="sm" onClick={onClose}>
              Lukk
            </Button>
          </div>
        </div>
        <p className="m-0 text-[13px] text-secondary-foreground">
          {questions === 0 ? "Ingen åpne spørsmål. " : `${questions} ${questions === 1 ? "åpent spørsmål" : "åpne spørsmål"} nederst i briefen. `}
          Lim den inn i Claude med «Bygg en MVP av denne flyten».
        </p>
        <div className="flex gap-1 border-b border-border">
          {(["brief", "json"] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                "min-h-11 border-b-2 border-transparent px-3 py-2 text-secondary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                tab === t && "border-primary font-semibold text-foreground",
              )}
            >
              {t === "brief" ? "Brief" : "Del som JSON"}
            </button>
          ))}
        </div>
        {tab === "brief" ? (
          <pre
            tabIndex={0}
            aria-label="Brief til Claude, kan rulles"
            className="m-0 min-h-0 flex-1 overflow-auto rounded-md bg-code p-4 font-mono text-[12.5px] leading-[1.55] wrap-break-word whitespace-pre-wrap text-code-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {lines.length > MAX_COLORED_LINES
              ? brief
              : lines.map((line, i) => (
                  <span key={i}>
                    <BriefLine line={line} />
                    {"\n"}
                  </span>
                ))}
          </pre>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <Textarea
              aria-label="Flyten som JSON. Lim inn en annen flyt her for å importere den."
              className="min-h-0 flex-1 font-mono text-[12.5px]"
              maxLength={undefined}
              value={jsonValue}
              onChange={(e) => {
                setDraft(e.target.value);
                setError(null);
              }}
            />
            {error && (
              <p className="m-0 text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={importJson} disabled={draft === null}>
                Importer flyten
              </Button>
              {draft !== null && (
                <Button size="sm" variant="ghost" onClick={() => { setDraft(null); setError(null); }}>
                  Forkast endringene
                </Button>
              )}
              {backup && (
                <Button size="sm" variant="ghost" onClick={() => { setDraft(backup); setError(null); }}>
                  Hent kopien som ikke kunne leses
                </Button>
              )}
            </div>
            <p className="m-0 text-xs text-muted-foreground">Kopier teksten og send den til en kollega. De limer den inn her og trykker «Importer flyten».</p>
          </div>
        )}
      </div>
    </div>
  );
}
