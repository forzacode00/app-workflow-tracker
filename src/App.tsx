import { ReactFlowProvider } from "@xyflow/react";
import { useCallback, useMemo, useState } from "react";
import { BriefDrawer } from "@/components/BriefDrawer";
import { FlowCanvas } from "@/components/canvas/FlowCanvas";
import { NodePanel } from "@/components/canvas/NodePanel";
import { Palette } from "@/components/canvas/Palette";
import { OverviewCanvas } from "@/components/overview/OverviewCanvas";
import { Toast } from "@/components/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useClipboard } from "@/hooks/useClipboard";
import { useToast } from "@/hooks/useToast";
import { useWorkspace } from "@/hooks/useWorkspace";
import { isBlank, SHORT } from "@/lib/flow";
import { openQuestions } from "@/lib/flowBrief";
import { moduleName } from "@/lib/workspace";
import { buildModuleBrief, buildWorkspaceBrief } from "@/lib/workspaceBrief";
import { readBackup } from "@/lib/workspaceStorage";

export default function App() {
  const actions = useWorkspace();
  const { toast, show, dismiss } = useToast();
  const copy = useClipboard();
  const [briefOpen, setBriefOpen] = useState(false);

  const moduleBrief = useMemo(() => buildModuleBrief(actions.ws), [actions.ws]);
  const workspaceBrief = useMemo(() => buildWorkspaceBrief(actions.ws), [actions.ws]);
  const questions = useMemo(() => openQuestions(actions.flow).length, [actions.flow]);
  const backup = useMemo(() => (actions.storage.loadError ? readBackup() : null), [actions.storage.loadError]);
  const otherModules = useMemo(() => actions.ws.moduler.filter((m) => m.id !== actions.ws.aktiv), [actions.ws]);
  const isExample = actions.module.eksempel;
  const overview = actions.view === "oversikt";

  const undoAction = useMemo(() => ({ label: "Angre", onClick: () => { if (actions.undo()) show("Hentet tilbake."); } }), [actions, show]);

  const copyText = async (text: string) => {
    const ok = await copy(text);
    show(ok ? "Kopiert. Lim det inn i Claude." : "Kunne ikke kopiere automatisk. Åpne briefen og marker teksten.");
  };

  const startNew = () => {
    const wasBlank = isBlank(actions.flow) || isExample;
    actions.reset();
    show(wasBlank ? "Klar. Skriv hva du vil oppnå." : "Modulen er tømt.", wasBlank ? undefined : undoAction);
  };

  const onRemoved = useCallback(
    (count: number) => {
      if (count > 0) show(count === 1 ? "Fjernet." : `Fjernet ${count}.`, undoAction);
    },
    [show, undoAction],
  );

  const addFromPalette = (type: Parameters<typeof actions.addNode>[0]) => {
    if (actions.addNode(type, actions.selectedId) === null) show("Modulen er full. Del den opp i flere moduler.");
  };

  const newModule = () => {
    if (actions.addModule() === null) show("Det er ikke plass til flere moduler.");
    else show("Ny modul. Skriv hva den skal oppnå.");
  };

  const closeBrief = useCallback(() => setBriefOpen(false), []);
  const onlySeed = actions.flow.nodes.length === 1 && !isExample && isBlank(actions.flow);
  const moduleOptions = actions.ws.moduler.map((m) => ({ value: m.id, label: moduleName(m) }));

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card px-3 py-2 sm:px-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
          <h1 className="text-[20px] font-bold tracking-[-0.01em]">Flytdesigner</h1>
          <Button size="sm" variant={overview ? "primary" : "outline"} aria-pressed={overview} onClick={() => actions.setView(overview ? "modul" : "oversikt")}>
            Oversikt
          </Button>
          {actions.ws.moduler.length > 1 && !overview && (
            <Select
              aria-label="Modul"
              options={moduleOptions}
              value={actions.ws.aktiv}
              onValueChange={actions.switchModule}
              className="min-h-10 w-[200px] py-1"
            />
          )}
          {!overview && (
            <Input
              aria-label="Navn på modulen"
              placeholder="Navn på modulen"
              value={actions.module.navn}
              onChange={(e) => actions.setName(e.target.value)}
              maxLength={SHORT}
              className="min-h-10 w-[170px] border-transparent bg-transparent px-2 hover:border-input focus-visible:border-input sm:w-[220px]"
            />
          )}
          {isExample && !overview && (
            <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11.5px] font-semibold text-primary">Eksempel, ikke dine data</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {!isExample && !overview && (
            <Button size="sm" onClick={() => { actions.loadExample(); show("Eksempelet er lastet: to moduler som snakker sammen.", undoAction); }}>
              Vis eksempel
            </Button>
          )}
          {overview ? (
            <Button size="sm" onClick={newModule}>
              + Ny modul
            </Button>
          ) : (
            <Button size="sm" onClick={startNew}>
              {isExample ? "Start egen modul" : "Tøm modulen"}
            </Button>
          )}
          <Button size="sm" onClick={() => setBriefOpen(true)} aria-haspopup="dialog" title={questions > 0 ? `${questions} åpne spørsmål i briefen` : undefined}>
            Vis brief
            {questions > 0 && !overview && (
              <span className="rounded-full bg-warning-soft px-1.5 text-[11px] font-semibold text-warning tabular-nums" aria-label={`${questions} åpne spørsmål`}>
                {questions}
              </span>
            )}
          </Button>
          <div className="hidden sm:block">
            <Button size="sm" variant="primary" onClick={() => copyText(overview ? workspaceBrief : moduleBrief)}>
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

      {overview ? (
        <div className="relative min-h-0 flex-1">
          <ReactFlowProvider>
            <OverviewCanvas actions={actions} />
          </ReactFlowProvider>
          <p className="pointer-events-none absolute top-3 left-1/2 m-0 w-[min(92%,520px)] -translate-x-1/2 rounded-md border border-border bg-card/95 px-3 py-2 text-center text-[13px] text-secondary-foreground shadow-sm">
            {actions.ws.moduler.length === 1
              ? "Én modul. Trykk «+ Ny modul» for den neste. Grensesnitt lager du inne i en modul: en start-, resultat- eller systemboks som peker på en annen modul."
              : "Hver boks er en modul. Pilene er grensesnittene, i dataenes retning. Dobbeltklikk eller «Åpne» for å gå inn."}
          </p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* Panelet ligger først i DOM (tastaturrekkefølge) men vises etter lerretet. */}
          {actions.selected && <NodePanel node={actions.selected} otherModules={otherModules} actions={actions} onRemoved={onRemoved} />}
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
      )}

      <BriefDrawer
        open={briefOpen}
        onClose={closeBrief}
        moduleBrief={moduleBrief}
        workspaceBrief={workspaceBrief}
        questions={questions}
        actions={actions}
        backup={backup}
        onCopy={copyText}
        onImported={(what) => {
          show(what === "workspace" ? "Arbeidsområdet er importert." : "Lagt til som ny modul.", undoAction);
          setBriefOpen(false);
        }}
      />
      <Toast toast={toast} onDismiss={dismiss} />
    </div>
  );
}
