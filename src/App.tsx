import { useMemo } from "react";
import { FormPanel } from "@/components/FormPanel";
import { PreviewPanel } from "@/components/PreviewPanel";
import { Button } from "@/components/ui/Button";
import { useClipboard } from "@/hooks/useClipboard";
import { useToast } from "@/hooks/useToast";
import { useWorkflow } from "@/hooks/useWorkflow";
import { buildBrief } from "@/lib/brief";
import { checkWorkflow } from "@/lib/checks";

export default function App() {
  const actions = useWorkflow();
  const toast = useToast();
  const copy = useClipboard();

  const brief = useMemo(() => buildBrief(actions.workflow), [actions.workflow]);
  const checks = useMemo(() => checkWorkflow(actions.workflow), [actions.workflow]);

  const copyBrief = async () => {
    const ok = await copy(brief);
    toast.show(ok ? "Briefen er kopiert. Lim den inn i Claude." : "Kunne ikke kopiere automatisk. Bruk fanen «Rå tekst».");
  };

  const startNew = () => {
    if (!window.confirm("Start på nytt? Det du har skrevet i denne nettleseren blir borte.")) return;
    actions.reset();
    document.getElementById("navn")?.focus();
  };

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-card px-5 py-3.5">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-[22px] font-bold tracking-[-0.01em]">Flytdesigner</h1>
          <span className="text-[13px] text-muted-foreground">Beskriv en arbeidsflyt. Få en brief Claude kan bygge fra.</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => { actions.loadExample(); toast.show("Eksempelet «Tilbudsforespørsel» er lastet."); }}>
            Last eksempel
          </Button>
          <Button onClick={startNew}>Ny, tom flyt</Button>
          <Button variant="primary" onClick={copyBrief}>
            Kopier brief
          </Button>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-69px)] grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <main className="border-b border-border p-5 lg:border-r lg:border-b-0">
          <FormPanel actions={actions} checks={checks} />
        </main>
        <aside className="p-5 lg:sticky lg:top-0 lg:max-h-screen lg:self-start lg:overflow-y-auto">
          <PreviewPanel brief={brief} checks={checks} actions={actions} onNotify={toast.show} />
        </aside>
      </div>

      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed bottom-4 left-1/2 -translate-x-1/2 rounded-md bg-foreground px-4 py-2 text-[13.5px] text-background transition-opacity ${toast.message ? "opacity-100" : "opacity-0"}`}
      >
        {toast.message}
      </div>
    </>
  );
}
