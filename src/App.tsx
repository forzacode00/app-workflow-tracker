import { ReactFlowProvider } from "@xyflow/react";
import { useCallback, useMemo, useState } from "react";
import { BriefDrawer } from "@/components/BriefDrawer";
import { FlowCanvas } from "@/components/canvas/FlowCanvas";
import { NodePanel } from "@/components/canvas/NodePanel";
import { Palette } from "@/components/canvas/Palette";
import { Toast } from "@/components/Toast";
import { Button } from "@/components/ui/Button";
import { useClipboard } from "@/hooks/useClipboard";
import { useFlow } from "@/hooks/useFlow";
import { useToast } from "@/hooks/useToast";
import { isBlank } from "@/lib/flow";
import { buildFlowBrief, openQuestions } from "@/lib/flowBrief";
import { readBackup } from "@/lib/flowStorage";

export default function App() {
  const actions = useFlow();
  const { toast, show, dismiss } = useToast();
  const copy = useClipboard();
  const [briefOpen, setBriefOpen] = useState(false);

  const brief = useMemo(() => buildFlowBrief(actions.flow), [actions.flow]);
  const questions = useMemo(() => openQuestions(actions.flow).length, [actions.flow]);
  const backup = useMemo(() => (actions.storage.loadError ? readBackup() : null), [actions.storage.loadError]);

  const undoAction = { label: "Angre", onClick: () => { if (actions.undo()) show("Kartet er hentet tilbake."); } };

  const copyBrief = async () => {
    const ok = await copy(brief);
    show(ok ? "Briefen er kopiert. Lim den inn i Claude." : "Kunne ikke kopiere automatisk. Åpne briefen og marker teksten.");
  };

  const startNew = () => {
    const wasBlank = isBlank(actions.flow) || actions.flow.eksempel;
    actions.reset();
    show(wasBlank ? "Klar. Begynn med målet: hva vil du oppnå?" : "Kartet er tømt.", wasBlank ? undefined : undoAction);
  };

  const closeBrief = useCallback(() => setBriefOpen(false), []);
  const boxes = actions.flow.nodes.length;

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card px-3 py-2 sm:px-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
          <h1 className="text-[20px] font-bold tracking-[-0.01em]">Flytdesigner</h1>
          <input
            aria-label="Navn på flyten"
            placeholder="Navn på flyten"
            value={actions.flow.navn}
            onChange={(e) => actions.setName(e.target.value)}
            maxLength={200}
            className="min-h-10 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 text-[15px] hover:border-input focus-visible:border-input focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:w-[260px] sm:flex-none"
          />
          {actions.flow.eksempel && (
            <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11.5px] font-semibold text-primary">Eksempel, ikke dine data</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {!actions.flow.eksempel && (
            <Button size="sm" onClick={() => { actions.loadExample(); show("Eksempelet er lastet.", undoAction); }}>
              Vis eksempel
            </Button>
          )}
          <Button size="sm" onClick={startNew}>
            {actions.flow.eksempel ? "Start egen flyt" : "Start på nytt"}
          </Button>
          <Button size="sm" onClick={() => setBriefOpen(true)} aria-haspopup="dialog">
            Vis brief{questions > 0 && <span className="rounded-full bg-warning-soft px-1.5 text-[11px] font-semibold text-warning tabular-nums">{questions}</span>}
          </Button>
          <Button size="sm" variant="primary" onClick={copyBrief}>
            Kopier brief
          </Button>
        </div>
      </header>

      {(actions.storage.loadError || actions.storage.saveFailed) && (
        <p role="alert" className="m-0 border-b border-warning bg-warning-soft px-4 py-2 text-sm text-warning">
          {actions.storage.loadError
            ? `Det som lå lagret i denne nettleseren kunne ikke leses. ${actions.storage.loadError} En kopi ligger under «Vis brief» → «Del som JSON».`
            : "Nettleseren lar oss ikke lagre. Kopier JSON under «Vis brief» før du lukker siden."}
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="relative min-h-0 flex-1">
          <ReactFlowProvider>
            <FlowCanvas actions={actions} />
          </ReactFlowProvider>
          {boxes <= 1 && !actions.flow.eksempel && (
            <p className="pointer-events-none absolute top-3 left-1/2 m-0 w-[min(92%,420px)] -translate-x-1/2 rounded-md border border-border bg-card/95 px-3 py-2 text-center text-[13px] text-secondary-foreground shadow-sm">
              Start med målet. Klikk på boksen, skriv én setning, og trykk <strong>+</strong> for å legge til det neste.
            </p>
          )}
          <div className="absolute bottom-3 left-1/2 max-w-[calc(100%-1.5rem)] -translate-x-1/2">
            <Palette hasSelection={actions.selected !== null} onAdd={(t) => actions.addNode(t, actions.selectedId)} />
          </div>
        </div>
        {actions.selected && (
          <NodePanel node={actions.selected} actions={actions} />
        )}
      </div>

      <BriefDrawer
        open={briefOpen}
        onClose={closeBrief}
        brief={brief}
        questions={questions}
        actions={actions}
        backup={backup}
        onCopy={copyBrief}
        onImported={() => { show("Flyten er importert.", undoAction); setBriefOpen(false); }}
      />
      <Toast toast={toast} onDismiss={dismiss} />
    </div>
  );
}
