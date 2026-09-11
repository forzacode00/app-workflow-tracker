import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import type { WorkflowActions } from "@/hooks/useWorkflow";
import { parseWorkflow, serializeWorkflow } from "@/lib/storage";

type Props = {
  actions: Pick<WorkflowActions, "workflow" | "replace">;
  /** Rå tekst fra lagring som ikke lot seg lese, til retting. */
  backup: string | null;
  onImported: () => void;
};

/** Viser flyten som JSON, og lar brukeren lime inn en annen flyt og importere den. */
export function JsonTab({ actions, backup, onImported }: Props) {
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const value = draft ?? serializeWorkflow(actions.workflow);

  const importJson = () => {
    const result = parseWorkflow(value);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    actions.replace(result.workflow);
    setDraft(null);
    setError(null);
    onImported();
  };

  const discard = () => {
    setDraft(null);
    setError(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <Textarea
        aria-label="Flyten som JSON. Lim inn en annen flyt her for å importere den."
        className="min-h-80 font-mono text-[12.5px]"
        maxLength={undefined}
        value={value}
        onChange={(e) => {
          setDraft(e.target.value);
          setError(null);
        }}
      />
      {draft !== null && !error && (
        <p className="m-0 text-xs text-warning" aria-live="polite">
          Teksten er endret, men ikke importert ennå.
        </p>
      )}
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
          <Button size="sm" variant="ghost" onClick={discard}>
            Forkast endringene
          </Button>
        )}
        {backup && (
          <Button size="sm" variant="ghost" onClick={() => { setDraft(backup); setError(null); }}>
            Hent kopien som ikke kunne leses
          </Button>
        )}
      </div>
    </div>
  );
}
