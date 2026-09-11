import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { NODE_META, type FlowNode } from "@/lib/flow";
import { cn } from "@/lib/utils";
import { TYPE_CLASS } from "./typeClass";

export type CardNode = Node<{ node: FlowNode; onGrow: (fromId: string) => void }, "boks">;

const HANDLE = "!size-3 !border-2 !border-card !bg-muted-foreground";

/** Én boks på lerretet: type øverst, tittel, og en «+» som lar kartet vokse fra boksen. */
export function NodeCard({ data, selected }: NodeProps<CardNode>) {
  const { node, onGrow } = data;
  const meta = NODE_META[node.type];
  const grow = meta.next[0];
  return (
    <div
      className={cn(
        "group relative w-[220px] rounded-md border-2 bg-card px-3 py-2 text-card-foreground shadow-sm transition-shadow",
        TYPE_CLASS[node.type],
        selected ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : "hover:shadow-md",
      )}
    >
      <Handle type="target" position={Position.Left} className={HANDLE} aria-label="Koble hit" />
      <span className="block text-[10.5px] font-semibold tracking-[0.08em] uppercase">{meta.label}</span>
      <span className={cn("block text-sm leading-snug font-medium text-card-foreground", !node.tittel && "text-muted-foreground italic")}>
        {node.tittel || meta.placeholder}
      </span>
      {node.notat && <span className="mt-0.5 line-clamp-2 block text-xs text-secondary-foreground">{node.notat}</span>}
      <Handle type="source" position={Position.Right} className={HANDLE} aria-label="Koble herfra" />
      {grow && (
        <button
          type="button"
          aria-label={`Legg til ${NODE_META[grow].label.toLowerCase()} etter ${node.tittel || meta.label}`}
          title={`+ ${NODE_META[grow].label}`}
          onClick={(e) => {
            e.stopPropagation();
            onGrow(node.id);
          }}
          className={cn(
            "nodrag absolute top-1/2 -right-4 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-lg leading-none text-foreground shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            selected ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
          )}
        >
          +
        </button>
      )}
    </div>
  );
}
