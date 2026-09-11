import { ReactFlowProvider } from "@xyflow/react";
import { useCallback, useMemo, useState } from "react";
import { BriefDrawer } from "@/components/BriefDrawer";
import { FlowCanvas } from "@/components/canvas/FlowCanvas";
import { NodePanel } from "@/components/canvas/NodePanel";
import { Palette } from "@/components/canvas/Palette";
import { Toast } from "@/components/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useClipboard } from "@/hooks/useClipboard";
import { useFlow } from "@/hooks/useFlow";
import { useToast } from "@/hooks/useToast";
import { isBlank, SHORT } from "@/lib/flow";
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

  const undoAction = useMemo(
    () => ({ label: "Angre", onClick: () => { if (actions.undo()) show("Hentet tilbake."); } }),
    [actions, show],
  );

  const copyBrief = async () => {
    const ok = await copy(brief);
    show(ok ? "Briefen er kopiert. Lim den inn i Claude." : "Kunne ikke kopiere automatisk. Åpne briefen og marker teksten.");
  };

  const startNew = () => {
    const wasBlank = isBlank(actions.flow) || actions.flow.eksempel;
    actions.reset();
    show(wasBlank ? "Klar. Skriv hva du vil oppnå." : "Flyten er tømt.", wasBlank ? undefined : undoAction);
  };

  const onRemoved = useCallback(
    (count: number) => {
      if (count > 0) show(count === 1 ? "Fjernet." : `Fjernet ${count}.`, undoAction);
    },
    [show, undoAction],
  );

  const addFromPalette = (type: Parameters<typeof actions.addNode>[0]) => {
    if (actions.addNode(type, actions.selectedId) === null) show("Flyten er full. Del den opp i flere flyter.");
  };

  const closeBrief = useCallback(() => setBriefOpen(false), []);
  const boxes = actions.flow.nodes.length;
  const onlySeed = boxes === 1 && !actions.flow.eksempel && isBlank(actions.flow);

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card px-3 py-2 sm:px-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
          <h1 className="text-[20px] font-bold tracking-[-0.01em]">Flytdesigner</h1>
          <Input
            aria-label="Navn på flyten"
            placeholder="Navn på flyten"
            value={actions.flow.navn}
            onChange={(e) => actions.setName(e.target.value)}
            maxLength={SHORT}
            className="min-h-10 w-[180px] border-transparent bg-transparent px-2 hover:border-input focus-visible:border-input sm:w-[260px]"
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
            Vis brief
            {questions > 0 && (
              <span className="rounded-full bg-warning-soft px-1.5 text-[11px] font-semibold text-warning tabular-nums" aria-label={`${questions} åpne spørsmål`}>
                {questions}
              </span>
            )}
          </Button>
          <div className="hidden sm:block">
            <Button size="sm" variant="primary" onClick={copyBrief}>
              Kopier brief
            </Button>
          </div>
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
        {/* Panelet ligger først i DOM (tastaturrekkefølge) men vises etter lerretet. */}
        {actions.selected && <NodePanel node={actions.selected} actions={actions} onRemoved={onRemoved} />}
        <div className="relative order-1 min-h-0 flex-1">
          <ReactFlowProvider>
            <FlowCanvas actions={actions} onRemoved={onRemoved} />
          </ReactFlowProvider>
          {onlySeed && (
            <p className="pointer-events-none absolute top-3 left-1/2 m-0 w-[min(92%,440px)] -translate-x-1/2 rounded-md border border-border bg-card/95 px-3 py-2 text-center text-[13px] text-secondary-foreground shadow-sm">
              Skriv hva du vil oppnå i feltet «Tittel», og trykk <strong>Enter</strong> eller <strong>+</strong> for det neste. Usikker? Trykk «Vis eksempel».
            </p>
          )}
          <Palette
            hasSelection={actions.selected !== null}
            onAdd={addFromPalette}
            className={`absolute bottom-3 left-1/2 max-w-[calc(100%-1.5rem)] -translate-x-1/2 ${actions.selected ? "hidden lg:flex" : ""}`}
          />
        </div>
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
