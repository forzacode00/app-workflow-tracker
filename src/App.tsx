import { useMemo } from "react";
import { FormPanel } from "@/components/FormPanel";
import { PreviewPanel } from "@/components/PreviewPanel";
import { Toast } from "@/components/Toast";
import { Button } from "@/components/ui/Button";
import { useClipboard } from "@/hooks/useClipboard";
import { useToast } from "@/hooks/useToast";
import { useWorkflow } from "@/hooks/useWorkflow";
import { buildBrief } from "@/lib/brief";
import { checkWorkflow } from "@/lib/checks";
import { readBackup } from "@/lib/storage";
import { isBlank } from "@/lib/types";

export default function App() {
  const actions = useWorkflow();
  const { toast, show, dismiss } = useToast();
  const copy = useClipboard();

  const brief = useMemo(() => buildBrief(actions.workflow), [actions.workflow]);
  const checks = useMemo(() => checkWorkflow(actions.workflow), [actions.workflow]);
  const backup = useMemo(() => (actions.storage.loadError ? readBackup() : null), [actions.storage.loadError]);

  const undoAction = { label: "Angre", onClick: () => { if (actions.undo()) show("Flyten er hentet tilbake."); } };

  const copyBrief = async () => {
    const ok = await copy(brief);
    show(ok ? "Briefen er kopiert. Lim den inn i Claude." : "Kunne ikke kopiere automatisk. Bruk fanen «Rå tekst».");
  };

  const startNew = () => {
    const wasEmpty = isBlank(actions.workflow) || actions.workflow.eksempel;
    actions.reset();
    document.getElementById("navn")?.focus();
    if (wasEmpty) show("Klar. Start med navnet på flyten.");
    else show("Flyten er tømt.", undoAction);
  };

  const loadExample = () => {
    actions.loadExample();
    show("Eksempelet «Tilbudsforespørsel» er lastet.", undoAction);
  };

  const pct = checks.length ? Math.round((checks.filter((c) => c.status === "done").length / checks.length) * 100) : 0;

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-card px-4 py-3.5 sm:px-5">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-[22px] font-bold tracking-[-0.01em]">Flytdesigner</h1>
          <span className="text-[13px] text-muted-foreground">Beskriv en arbeidsflyt. Få en brief Claude kan bygge fra.</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {!actions.workflow.eksempel && <Button onClick={loadExample}>Vis eksempel</Button>}
          <Button onClick={startNew}>Start på nytt</Button>
          <div className="hidden lg:block">
            <Button variant="primary" onClick={copyBrief}>
              Kopier brief
            </Button>
          </div>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-69px)] grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <main className="border-b border-border p-4 pb-24 sm:p-5 lg:border-r lg:border-b-0 lg:pb-5">
          <FormPanel actions={actions} checks={checks} onStartOwn={startNew} />
        </main>
        <aside id="forhandsvisning" className="scroll-mt-2 p-4 pb-24 sm:p-5 lg:sticky lg:top-0 lg:max-h-screen lg:self-start lg:overflow-y-auto lg:pb-5">
          <PreviewPanel
            brief={brief}
            checks={checks}
            actions={actions}
            backup={backup}
            onImported={() => show("Flyten er importert.", undoAction)}
          />
        </aside>
      </div>

      {/* Hovedhandlingen må være innen rekkevidde på mobil, der forhåndsvisningen ligger under hele skjemaet. */}
      <div className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-between gap-3 border-t border-border bg-card px-4 py-2.5 lg:hidden">
        <span className="text-sm text-secondary-foreground tabular-nums">{pct} % komplett</span>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => document.getElementById("forhandsvisning")?.scrollIntoView({ behavior: "smooth" })}>
            Se brief
          </Button>
          <Button size="sm" variant="primary" onClick={copyBrief}>
            Kopier brief
          </Button>
        </div>
      </div>

      <Toast toast={toast} onDismiss={dismiss} />
    </>
  );
}
