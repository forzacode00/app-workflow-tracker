import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { memo } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export type ModuleCardData = {
  navn: string;
  maal: string;
  bokser: number;
  sporsmal: number;
  aktiv: boolean;
  eksempel: boolean;
  onOpen: (id: string) => void;
  onRemove: (id: string) => void;
};
export type ModuleNode = Node<ModuleCardData, "modul">;

/* Håndtak på begge sider, så pilen fester seg i siden som vender mot den andre modulen. De kan ikke brukes: grensesnitt lages inne i modulen. */
const HANDLE = "!opacity-0 !pointer-events-none";

/** Én modul i oversikten. «Åpne» går inn i modulen, «Fjern» tar den bort (kan angres). */
export const ModuleCard = memo(function ModuleCard({ id, data, selected }: NodeProps<ModuleNode>) {
  /* «Fjern» er alltid synlig: fjerning kan angres, og skjulte knapper blir ikke funnet. */
  return (
    <div
      className={cn(
        "group relative w-[280px] rounded-md border-2 bg-card px-4 py-3 text-card-foreground shadow-sm",
        data.aktiv ? "border-primary" : "border-border",
        selected && "ring-2 ring-ring ring-offset-2 ring-offset-background",
      )}
    >
      <Handle id="venstre" type="target" position={Position.Left} className={HANDLE} />
      <Handle id="hoyre" type="target" position={Position.Right} className={HANDLE} />
      <span className="block text-[11.5px] font-semibold tracking-[0.08em] text-primary uppercase">Modul{data.eksempel ? " · eksempel" : ""}</span>
      <span className="block text-[15px] leading-snug font-bold">{data.navn}</span>
      {data.maal && data.maal !== data.navn && <span className="mt-1 line-clamp-2 block text-xs text-secondary-foreground">{data.maal}</span>}
      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground tabular-nums">
        <span>
          {data.bokser} {data.bokser === 1 ? "boks" : "bokser"}
          {data.sporsmal > 0 && (
            <span className="ml-2 rounded-full bg-warning-soft px-1.5 font-semibold text-warning">
              {data.sporsmal} {data.sporsmal === 1 ? "åpent spørsmål" : "åpne spørsmål"}
            </span>
          )}
        </span>
        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant="danger"
            className="nodrag"
            onClick={(e) => {
              e.stopPropagation();
              data.onRemove(id);
            }}
          >
            Fjern
          </Button>
          <Button
            size="sm"
            className="nodrag"
            onClick={(e) => {
              e.stopPropagation();
              data.onOpen(id);
            }}
          >
            Åpne
          </Button>
        </div>
      </div>
      <Handle id="venstre" type="source" position={Position.Left} className={HANDLE} />
      <Handle id="hoyre" type="source" position={Position.Right} className={HANDLE} />
    </div>
  );
});
