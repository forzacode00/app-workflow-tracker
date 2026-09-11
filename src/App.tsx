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
import { isBlank, SHORT, type NodeType } from "@/lib/flow";
import { openQuestions } from "@/lib/flowBrief";
import { moduleName } from "@/lib/workspace";
import { buildModuleBrief, buildWorkspaceBrief } from "@/lib/workspaceBrief";
import { readBackup } from "@/lib/workspaceStorage";

export default function App() {
  const actions = useWorkspace();
  const { toast, show, dismiss } = useToast();
  const copy = useClipboard();
  const [briefOpen, setBriefOpen] = useState(false);
  const { ws, flow, module, undo } = actions;

  /* Briefene er tunge for store nettsteder. De bygges bare når skuffen er åpen, ellers på forespørsel. */
  const moduleBrief = useMemo(() => (briefOpen ? buildModuleBrief(ws) : ""), [briefOpen, ws]);
  const workspaceBrief = useMemo(() => (briefOpen ? buildWorkspaceBrief(ws) : ""), [briefOpen, ws]);
  const questions = useMemo(() => openQuestions(flow).length, [flow]);
  const backup = useMemo(() => (actions.storage.loadError ? readBackup() : null), [actions.storage.loadError]);
  const otherModules = useMemo(() => ws.moduler.filter((m) => m.id !== ws.aktiv), [ws]);
  const moduleNames = useMemo(() => Object.fromEntries(ws.moduler.map((m) => [m.id, moduleName(m)])), [ws.moduler]);
  const isExample = module.eksempel;
  const overview = actions.view === "oversikt";
  const many = ws.moduler.length > 1;

  const undoAction = useMemo(() => ({ label: "Angre", onClick: () => { if (undo()) show("Hentet tilbake."); } }), [undo, show]);

  const copyText = async (text: string) => {
    const ok = await copy(text);
    show(ok ? "Kopiert. Lim det inn i Claude." : "Kunne ikke kopiere automatisk. Åpne briefen og marker teksten.");
  };
  const copyBrief = () => copyText(overview ? buildWorkspaceBrief(ws) : buildModuleBrief(ws));

  const startNew = () => {
    const wasBlank = isBlank(flow) || isExample;
    actions.reset();
    show(isExample ? "Eksempelet er fjernet. Skriv hva du vil oppnå." : wasBlank ? "Klar. Skriv hva du vil oppnå." : "Modulen er tømt.", wasBlank ? undefined : undoAction);
  };

  const onRemoved = useCallback(
    (count: number) => {
      if (count > 0) show(count === 1 ? "Fjernet." : `Fjernet ${count}.`, undoAction);
    },
    [show, undoAction],
  );

  const newModule = useCallback(() => {
    if (actions.addModule() === null) show("Nettstedet har 50 moduler, det er taket.");
    else show("Ny modul. Skriv hva den skal oppnå.");
  }, [actions, show]);

  /** Fra panelet: lag modulen og la boksen peke på den, uten å forlate boksen. */
  const newModuleFor = useCallback(
    (nodeId: string) => {
      const id = actions.addModule("", { stay: true });
      if (id === null) {
        show("Nettstedet har 50 moduler, det er taket.");
        return;
      }
      actions.updateNode(nodeId, { ref: id });
      show("Ny modul laget, og boksen peker på den. Bytt modul øverst når du vil fylle den.");
    },
    [actions, show],
  );

  const removeModule = useCallback(
    (id: string) => {
      actions.removeModule(id);
      show("Modulen er fjernet. Bokser som pekte på den, peker ikke lenger på noe.", undoAction);
    },
    [actions, show, undoAction],
  );

  const addFromPalette = (type: NodeType) => {
    if (actions.addNode(type, actions.selectedId) === null) {
      show("Modulen har 200 bokser, det er taket. Lag en ny modul for resten.", { label: "Ny modul", onClick: newModule });
    }
  };

  const onTruncated = useCallback((hidden: number) => show(`${hidden} grensesnitt vises ikke i oversikten. Alle står i briefen for hele nettstedet.`), [show]);
  const closeBrief = useCallback(() => setBriefOpen(false), []);
  const onlySeed = flow.nodes.length === 1 && !isExample && isBlank(flow);
  const moduleOptions = ws.moduler.map((m) => ({ value: m.id, label: moduleName(m) }));

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card px-3 py-2 sm:px-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
          <h1 className="hidden text-[20px] font-bold tracking-[-0.01em] sm:block">Flytdesigner</h1>
          <Button size="sm" variant={overview ? "primary" : "outline"} aria-pressed={overview} onClick={() => actions.setView(overview ? "modul" : "oversikt")}>
            Oversikt
          </Button>
          {many && !overview && (
            <Select aria-label="Modul" options={moduleOptions} value={ws.aktiv} onValueChange={actions.switchModule} className="min-h-10 w-[160px] py-1" />
          )}
          {!overview && (
            <Input
              aria-label="Navn på modulen"
              placeholder="Navn på modulen"
              value={module.navn}
              onChange={(e) => actions.setName(e.target.value)}
              maxLength={SHORT}
              className={`min-h-10 w-[170px] border-transparent bg-transparent px-2 hover:border-input focus-visible:border-input sm:w-[200px] ${many ? "hidden lg:block" : ""}`}
            />
          )}
          {isExample && !overview && (
            <span className="hidden rounded-full bg-primary-soft px-2 py-0.5 text-[11.5px] font-semibold text-primary sm:inline">Eksempel, ikke dine data</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {!isExample && !many && !overview && (
            <Button size="sm" className={onlySeed ? "" : "hidden sm:inline-flex"} onClick={() => { actions.loadExample(); show("Eksempelet er lastet: to moduler som snakker sammen.", undoAction); }}>
              Vis eksempel
            </Button>
          )}
          {overview ? (
            <Button size="sm" onClick={newModule}>
              + Ny modul
            </Button>
          ) : (
            <Button size="sm" onClick={startNew} className={isExample ? "" : "hidden sm:inline-flex"}>
              {isExample ? "Start egen modul" : "Tøm modulen"}
            </Button>
          )}
          <Button size="sm" onClick={() => setBriefOpen(true)} aria-haspopup="dialog" title={questions > 0 ? `${questions} åpne spørsmål i briefen` : undefined}>
            Vis brief
            {questions > 0 && !overview && (
              <span className="rounded-full bg-warning-soft px-1.5 text-[11px] font-semibold text-warning tabular-nums">
                {questions}
                <span className="sr-only"> åpne spørsmål</span>
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

      {overview ? (
        <div className="relative min-h-0 flex-1">
          <ReactFlowProvider>
            <OverviewCanvas actions={actions} onRemoveModule={removeModule} onTruncated={onTruncated} />
          </ReactFlowProvider>
          <p className="pointer-events-none absolute top-3 left-1/2 m-0 w-[min(92%,520px)] -translate-x-1/2 rounded-md border border-border bg-card/95 px-3 py-2 text-center text-[13px] text-secondary-foreground shadow-sm">
            {many
              ? "Hver boks er en modul, pilene er grensesnitt i dataenes retning. «Åpne» går inn. "
              : "Én modul så langt. «+ Ny modul» lager den neste. "}
            Grensesnitt lager du inne i en modul: velg en start-, resultat- eller systemboks og svar på «Mottar fra» eller «Sender til en annen modul?».
          </p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* Panelet ligger først i DOM (tastaturrekkefølge) men vises etter lerretet. */}
          {actions.selected && (
            <NodePanel node={actions.selected} otherModules={otherModules} actions={actions} onRemoved={onRemoved} onNewModule={newModuleFor} />
          )}
          <div className="relative order-1 min-h-0 flex-1">
            <ReactFlowProvider>
              <FlowCanvas actions={actions} onRemoved={onRemoved} moduleNames={moduleNames} />
            </ReactFlowProvider>
            {onlySeed && (
              <p className="pointer-events-none absolute top-3 left-1/2 m-0 w-[min(92%,440px)] -translate-x-1/2 rounded-md border border-border bg-card/95 px-3 py-2 text-center text-[13px] text-secondary-foreground shadow-sm">
                Skriv hva du vil oppnå i feltet «Tittel», og trykk <strong>Enter</strong> eller <strong>+</strong> for det neste.
                {!many && " Usikker? Trykk «Vis eksempel»."}
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
        initialTab={overview ? "nettsted" : "modul"}
        moduleLabel={moduleName(module)}
        onClose={closeBrief}
        moduleBrief={moduleBrief}
        workspaceBrief={workspaceBrief}
        questions={questions}
        actions={actions}
        backup={backup}
        onCopy={copyText}
        onImported={(what) => {
          show(what === "workspace" ? "Nettstedet er importert." : "Lagt til og åpnet som ny modul.", undoAction);
          setBriefOpen(false);
        }}
      />
      <Toast toast={toast} onDismiss={dismiss} />
    </div>
  );
}
