import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import type { FlowActions } from "@/hooks/useWorkspace";
import { cn } from "@/lib/utils";
import { parseWorkspace, serializeWorkspace } from "@/lib/workspaceStorage";

type Tab = "modul" | "nettsted" | "json";
const TABS: { id: Tab; label: string }[] = [
  { id: "modul", label: "Denne modulen" },
  { id: "nettsted", label: "Hele nettstedet" },
  { id: "json", label: "Del som JSON" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  moduleBrief: string;
  workspaceBrief: string;
  questions: number;
  actions: Pick<FlowActions, "ws" | "replace" | "insertModule">;
  backup: string | null;
  onCopy: (text: string) => void;
  onImported: (what: "workspace" | "module") => void;
};

const MAX_COLORED_LINES = 2000;

function BriefLine({ line }: { line: string }) {
  if (/^#+ /.test(line)) return <span className="font-medium text-code-heading">{line}</span>;
  if (/^(---)/.test(line)) return <span className="text-code-dim">{line}</span>;
  return <>{line}</>;
}

function BriefView({ text, label }: { text: string; label: string }) {
  const lines = text.split("\n");
  return (
    <pre
      tabIndex={0}
      aria-label={label}
      className="m-0 min-h-0 flex-1 overflow-auto rounded-md bg-code p-4 font-mono text-[12.5px] leading-[1.55] wrap-break-word whitespace-pre-wrap text-code-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {lines.length > MAX_COLORED_LINES
        ? text
        : lines.map((line, i) => (
            <span key={i}>
              <BriefLine line={line} />
              {"\n"}
            </span>
          ))}
    </pre>
  );
}

/** Skuff fra høyre med briefen for modulen, oversikten over nettstedet, og JSON for deling. */
export function BriefDrawer({ open, onClose, moduleBrief, workspaceBrief, questions, actions, backup, onCopy, onImported }: Props) {
  const [tab, setTab] = useState<Tab>("modul");
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

  const jsonValue = draft ?? serializeWorkspace(actions.ws);
  const importJson = () => {
    const r = parseWorkspace(jsonValue);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    if (r.kind === "workspace") actions.replace(r.workspace);
    else if (!actions.insertModule(r.module)) {
      setError("Det er ikke plass til flere moduler. Fjern en først.");
      return;
    }
    setDraft(null);
    setError(null);
    onImported(r.kind);
  };
  const currentText = tab === "nettsted" ? workspaceBrief : tab === "json" ? jsonValue : moduleBrief;

  return (
    <div className="fixed inset-0 z-30 flex justify-end" role="dialog" aria-modal="true" aria-label="Brief til Claude">
      <button type="button" aria-label="Lukk" className="flex-1 bg-foreground/40" onClick={onClose} />
      <div className="flex w-full max-w-[640px] flex-col gap-3 bg-card p-4 shadow-xl sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Brief til Claude</h2>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={() => onCopy(currentText)}>
              {tab === "json" ? "Kopier JSON" : "Kopier brief"}
            </Button>
            <Button ref={closeRef} size="sm" onClick={onClose}>
              Lukk
            </Button>
          </div>
        </div>
        <p className="m-0 text-[13px] text-secondary-foreground">
          {tab === "modul" &&
            `${questions === 0 ? "Ingen åpne spørsmål. " : `${questions} ${questions === 1 ? "åpent spørsmål" : "åpne spørsmål"} nederst i briefen. `}Lim den inn i Claude med «Bygg en MVP av denne modulen».`}
          {tab === "nettsted" && "Alle modulene og grensesnittene mellom dem. Gi denne til Claude sammen med modulbriefen når modulene skal snakke sammen."}
          {tab === "json" && "Hele arbeidsområdet. Kopier og send til en kollega; de limer inn her og trykker «Importer»."}
        </p>
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
        {tab === "modul" && <BriefView text={moduleBrief} label="Brief til Claude, kan rulles" />}
        {tab === "nettsted" && <BriefView text={workspaceBrief} label="Oversikt over nettstedet, kan rulles" />}
        {tab === "json" && (
          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <Textarea
              aria-label="Arbeidsområdet som JSON. Lim inn noe fra en kollega her for å importere det."
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
                Importer
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
            <p className="m-0 text-xs text-muted-foreground">
              Et helt arbeidsområde erstatter ditt. Én enkelt flyt legges til som ny modul. Begge deler kan angres.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
