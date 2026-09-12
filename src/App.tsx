import { ReactFlowProvider } from "@xyflow/react";
import { useCallback, useMemo, useState } from "react";
import { BriefDrawer } from "@/components/BriefDrawer";
import { FlowCanvas } from "@/components/canvas/FlowCanvas";
import { NodePanel } from "@/components/canvas/NodePanel";
import { Palette } from "@/components/canvas/Palette";
import { Intervju } from "@/components/Intervju";
import { OverviewCanvas } from "@/components/overview/OverviewCanvas";
import { SlikTenkerDu } from "@/components/SlikTenkerDu";
import { Toast } from "@/components/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Velkommen } from "@/components/Velkommen";
import { useClipboard } from "@/hooks/useClipboard";
import { useToast } from "@/hooks/useToast";
import { EXAMPLES, useWorkspace, type ExampleId } from "@/hooks/useWorkspace";
import { isBlank, NODE_META, SHORT, type NodeType } from "@/lib/flow";
import { nextStep, openQuestions } from "@/lib/flowBrief";
import { asFlow, moduleName, type Module } from "@/lib/workspace";
import { buildModuleBrief, buildWorkspaceBrief } from "@/lib/workspaceBrief";
import { readBackup } from "@/lib/workspaceStorage";

type Skjerm = "velkommen" | "intervju" | null;

export default function App() {
  const actions = useWorkspace();
  const { toast, show, dismiss } = useToast();
  const copy = useClipboard();
  const [briefOpen, setBriefOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  /* Rett etter intervjuet: si hva neste steg er, i stedet for å dytte om det som ble hoppet over. */
  const [fraIntervju, setFraIntervju] = useState(false);
  const { ws, flow, module, undo } = actions;
  /* Hver gang siden åpnes: si hva appen er til for før noe annet (Magnus, runde 5). Lukkes med knapp. */
  const [skjerm, setSkjerm] = useState<Skjerm>("velkommen");
  const harNoe = !(ws.moduler.length === 1 && isBlank(asFlow(ws.moduler[0]!)));

  /* Bestillingene er tunge for store nettsteder. De bygges bare når skuffen er åpen, ellers på forespørsel. */
  const moduleBrief = useMemo(() => (briefOpen ? buildModuleBrief(ws) : ""), [briefOpen, ws]);
  const workspaceBrief = useMemo(() => (briefOpen ? buildWorkspaceBrief(ws) : ""), [briefOpen, ws]);
  const questionList = useMemo(() => openQuestions(flow), [flow]);
  const questions = questionList.length;
  const next = useMemo(() => nextStep(flow), [flow]);
  const backup = useMemo(() => (actions.storage.loadError ? readBackup() : null), [actions.storage.loadError]);
  const otherModules = useMemo(() => ws.moduler.filter((m) => m.id !== ws.aktiv), [ws]);
  const moduleNames = useMemo(() => Object.fromEntries(ws.moduler.map((m) => [m.id, moduleName(m)])), [ws.moduler]);
  const isExample = module.eksempel;
  const allExample = ws.moduler.every((m) => m.eksempel);
  const overview = actions.view === "oversikt";
  const many = ws.moduler.length > 1;
  const started = flow.nodes.some((n) => n.type === "maal" && n.tittel.trim());

  const undoAction = useMemo(() => ({ label: "Angre", onClick: () => { if (undo()) show("Hentet tilbake."); } }), [undo, show]);

  const copyText = async (text: string) => {
    const ok = await copy(text);
    show(ok ? "Kopiert. Lim det inn i Claude." : "Kunne ikke kopiere automatisk. Åpne bestillingen og marker teksten.");
  };
  const copyBrief = () => {
    setFraIntervju(false);
    return copyText(overview ? buildWorkspaceBrief(ws) : buildModuleBrief(ws));
  };

  const loadExample = (which: ExampleId) => {
    actions.loadExample(which);
    const ex = EXAMPLES.find((e) => e.id === which);
    show(`Eksempelet «${ex?.label ?? which}» er lastet.`, undoAction);
  };

  const newModule = useCallback(() => {
    if (actions.addModule() === null) show("Du kan ha 50 moduler, det er taket.");
    else show("Ny modul. Skriv hva den skal oppnå.");
  }, [actions, show]);

  /** «Start egen modul» i et eksempel: still spørsmålene, og legg modulen ved siden av eksempelet. */
  const startNew = () => {
    if (isExample) {
      setSkjerm("intervju");
      return;
    }
    const wasBlank = isBlank(flow);
    actions.reset();
    show(wasBlank ? "Klar. Skriv hva du vil oppnå." : "Modulen er tømt.", wasBlank ? undefined : undoAction);
  };

  const clearExample = () => {
    actions.reset();
    show("Eksempelet er fjernet. Skriv hva du vil oppnå.", undoAction);
  };

  /* Velkomst og intervju */
  const leaveWelcome = (to: Skjerm) => setSkjerm(to);
  const welcomeExample = () => {
    leaveWelcome(null);
    loadExample("tilbud");
  };
  const interviewDone = useCallback(
    (m: Module) => {
      if (!actions.adoptModule(m)) {
        show("Du kan ha 50 moduler, det er taket. Fjern en i oversikten først.");
        return;
      }
      setSkjerm(null);
      setFraIntervju(true);
      show("Tegningen er klar. Neste steg: trykk «Kopier bestillingen» og lim inn i Claude.");
    },
    [actions, show],
  );
  const drawInstead = () => {
    setSkjerm(null);
    if (!isBlank(flow)) newModule();
  };

  const onRemoved = useCallback(
    (count: number) => {
      if (count > 0) show(count === 1 ? "Fjernet." : `Fjernet ${count}.`, undoAction);
    },
    [show, undoAction],
  );

  /** Fra panelet: lag modulen og la boksen peke på den, uten å forlate boksen. */
  const newModuleFor = useCallback(
    (nodeId: string) => {
      const id = actions.addModule("", { stay: true });
      if (id === null) {
        show("Du kan ha 50 moduler, det er taket.");
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

  const onTruncated = useCallback((hidden: number) => show(`${hidden} grensesnitt vises ikke i oversikten. Alle står i bestillingen for hele nettstedet.`), [show]);
  const closeBrief = useCallback(() => setBriefOpen(false), []);
  const closeHelp = useCallback(() => setHelpOpen(false), []);
  const onlySeed = flow.nodes.length === 1 && !isExample && isBlank(flow);
  const moduleOptions = ws.moduler.map((m) => ({ value: m.id, label: moduleName(m) }));
  const hintClass =
    "absolute top-3 right-14 left-3 m-0 rounded-md border border-border bg-card/95 px-3 py-2 text-center text-[13px] text-secondary-foreground shadow-sm sm:right-auto sm:left-1/2 sm:w-[min(92%,460px)] sm:-translate-x-1/2";

  if (skjerm === "velkommen") {
    return <Velkommen harNoe={harNoe} onStart={() => leaveWelcome("intervju")} onExample={welcomeExample} onCanvas={() => leaveWelcome(null)} />;
  }
  if (skjerm === "intervju") {
    return (
      <>
        <Intervju onDone={interviewDone} onCancel={() => setSkjerm(null)} onDrawInstead={drawInstead} />
        <Toast toast={toast} onDismiss={dismiss} />
      </>
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card px-3 py-2 sm:px-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
          <h1 className="hidden text-[20px] font-bold tracking-[-0.01em] sm:block">Flytdesigner</h1>
          <Button size="sm" variant={overview ? "primary" : "outline"} aria-pressed={overview} onClick={() => actions.setView(overview ? "modul" : "oversikt")}>
            Oversikt
          </Button>
          {many && !overview && (
            <div className="w-[160px]">
              <Select aria-label="Modul" options={moduleOptions} value={ws.aktiv} onValueChange={actions.switchModule} className="min-h-10 py-1" />
            </div>
          )}
          {!overview && (
            <div className={`w-[170px] sm:w-[200px] ${many ? "hidden lg:block" : ""}`}>
              <Input
                aria-label="Navn på modulen"
                placeholder="Navn på modulen"
                value={module.navn}
                onChange={(e) => actions.setName(e.target.value)}
                maxLength={SHORT}
                className="min-h-10 border-transparent bg-transparent px-2 hover:border-input focus-visible:border-input"
              />
            </div>
          )}
          {isExample && !overview && (
            <span className="hidden rounded-full bg-primary-soft px-2 py-0.5 text-[11.5px] font-semibold text-primary sm:inline">Eksempel, ikke dine data</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" onClick={() => setHelpOpen(true)} aria-haspopup="dialog" aria-expanded={helpOpen} aria-label="Slik tenker du">
            <span aria-hidden="true">?</span>
            <span className="hidden md:inline">Slik tenker du</span>
          </Button>
          {!isExample && !many && !overview && (
            <details className={`relative ${onlySeed ? "" : "hidden sm:block"}`}>
              <summary className="list-none [&::-webkit-details-marker]:hidden">
                <Button size="sm" onClick={(e) => { (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.toggleAttribute("open"); e.preventDefault(); }} aria-haspopup="menu">
                  Vis eksempel
                </Button>
              </summary>
              <div role="menu" className="absolute right-0 z-20 mt-1 w-[280px] rounded-md border border-border bg-card p-1 shadow-lg">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    role="menuitem"
                    onClick={() => loadExample(ex.id)}
                    className="block w-full rounded px-3 py-2 text-left hover:bg-subtle focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <span className="block text-sm font-semibold">{ex.label}</span>
                    <span className="block text-xs text-secondary-foreground">{ex.beskrivelse}</span>
                  </button>
                ))}
              </div>
            </details>
          )}
          {overview ? (
            <>
              {allExample && (
                <Button size="sm" onClick={clearExample}>
                  Fjern eksempelet
                </Button>
              )}
              <Button size="sm" onClick={() => setSkjerm("intervju")}>
                + Ny modul
              </Button>
            </>
          ) : (
            <div className={isExample ? "" : "hidden sm:block"}>
              <Button size="sm" onClick={startNew}>
                {isExample ? "Start egen modul" : "Tøm modulen"}
              </Button>
            </div>
          )}
          <Button size="sm" onClick={() => setBriefOpen(true)} aria-haspopup="dialog" title={questions > 0 ? `${questions} åpne spørsmål i bestillingen` : undefined}>
            Vis bestilling
            {questions > 0 && started && !overview && (
              <span className="rounded-full bg-warning-soft px-1.5 text-[11px] font-semibold text-warning tabular-nums">
                {questions}
                <span className="sr-only"> åpne spørsmål</span>
              </span>
            )}
          </Button>
          {/* På tomt lerret er det ingenting å kopiere; da får mobilen én rad mindre. */}
          <div className={onlySeed ? "hidden sm:block" : ""}>
            <Button size="sm" variant="primary" onClick={copyBrief}>
              Kopier bestillingen
            </Button>
          </div>
        </div>
      </header>

      {(actions.storage.loadError || actions.storage.saveFailed) && (
        <p role="alert" className="m-0 border-b border-warning bg-warning-soft px-4 py-2 text-sm text-warning">
          {actions.storage.loadError
            ? `Det som lå lagret i denne nettleseren kunne ikke leses. ${actions.storage.loadError} En kopi ligger under «Vis bestilling» → «Del som JSON».`
            : "Nettleseren lar oss ikke lagre. Kopier JSON under «Vis bestilling» før du lukker siden."}
        </p>
      )}

      {overview ? (
        <div className="relative min-h-0 flex-1">
          <ReactFlowProvider>
            <OverviewCanvas actions={actions} onRemoveModule={removeModule} onTruncated={onTruncated} />
          </ReactFlowProvider>
          <p className={`pointer-events-none ${hintClass} sm:w-[min(92%,520px)]`}>
            {many
              ? "Hver boks er en modul, pilene er grensesnitt i dataenes retning. «Åpne» går inn. "
              : "Én modul så langt. «+ Ny modul» stiller spørsmålene for den neste. "}
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
              <div className={`${hintClass} flex flex-col items-center gap-2`}>
                <span>
                  Skriv hva du vil oppnå i feltet «Tittel», og trykk <strong>Enter</strong> eller <strong>+</strong> for det neste.
                </span>
                <Button size="sm" onClick={() => setSkjerm("intervju")}>
                  Svar på spørsmål i stedet
                </Button>
              </div>
            )}
            {fraIntervju && !actions.selected && !briefOpen && (
              <div className={`${hintClass} flex flex-wrap items-center justify-center gap-2`}>
                <span>
                  <span className="font-semibold text-foreground">Tegningen er klar.</span> Trykk «Kopier bestillingen» og lim inn i Claude. Vil du endre noe,
                  trykk på en boks.
                </span>
              </div>
            )}
            {/* Dytt: det ene neste spørsmålet i tankemodellen, med knappen som svarer på det. */}
            {!onlySeed && !isExample && next && !(fraIntervju && !actions.selected) && (
              <div className={`${hintClass} flex items-center justify-center gap-2`}>
                <span>
                  <span className="font-semibold text-foreground">Neste:</span> {next.text}
                </span>
                <Button size="sm" className="shrink-0" onClick={() => actions.addNode(next.type, next.from ?? null)}>
                  + {NODE_META[next.type].label}
                </Button>
              </div>
            )}
            <Palette
              hasSelection={actions.selected !== null}
              onAdd={addFromPalette}
              className={`absolute bottom-3 left-1/2 max-w-[calc(100%-1.5rem)] -translate-x-1/2 ${actions.selected ? "hidden lg:flex" : ""}`}
            />
          </div>
        </div>
      )}

      <SlikTenkerDu open={helpOpen} onClose={closeHelp} onIntro={() => { setHelpOpen(false); setSkjerm("velkommen"); }} />
      <BriefDrawer
        open={briefOpen}
        initialTab={overview ? "nettsted" : "modul"}
        moduleLabel={moduleName(module)}
        onClose={closeBrief}
        moduleBrief={moduleBrief}
        workspaceBrief={workspaceBrief}
        questions={questions}
        questionList={questionList}
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
