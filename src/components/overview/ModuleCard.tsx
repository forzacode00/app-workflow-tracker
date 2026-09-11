import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { memo } from "react";
import { cn } from "@/lib/utils";

export type ModuleCardData = {
  navn: string;
  maal: string;
  bokser: number;
  sporsmal: number;
  aktiv: boolean;
  eksempel: boolean;
  onOpen: (id: string) => void;
};
export type ModuleNode = Node<ModuleCardData, "modul">;

/** Én modul i oversikten. Klikk på «Åpne» går inn i modulen. */
export const ModuleCard = memo(function ModuleCard({ id, data, selected }: NodeProps<ModuleNode>) {
  return (
    <div
      className={cn(
        "group relative w-[280px] rounded-md border-2 bg-card px-4 py-3 text-card-foreground shadow-sm",
        data.aktiv ? "border-primary" : "border-border",
        selected && "ring-2 ring-ring ring-offset-2 ring-offset-background",
      )}
    >
      <Handle type="target" position={Position.Left} className="!size-3 !border-2 !border-card !bg-muted-foreground" />
      <span className="block text-[10.5px] font-semibold tracking-[0.08em] text-primary uppercase">Modul{data.eksempel ? " · eksempel" : ""}</span>
      <span className="block text-[15px] leading-snug font-bold">{data.navn}</span>
      {data.maal && <span className="mt-1 line-clamp-2 block text-xs text-secondary-foreground">{data.maal}</span>}
      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground tabular-nums">
        <span>
          {data.bokser} {data.bokser === 1 ? "boks" : "bokser"}
          {data.sporsmal > 0 && <span className="ml-2 rounded-full bg-warning-soft px-1.5 font-semibold text-warning">{data.sporsmal} åpne</span>}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            data.onOpen(id);
          }}
          className="nodrag min-h-9 rounded-md border border-input bg-card px-2.5 text-[13px] font-medium text-foreground hover:bg-subtle focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Åpne
        </button>
      </div>
      <Handle type="source" position={Position.Right} className="!size-3 !border-2 !border-card !bg-muted-foreground" />
    </div>
  );
});
