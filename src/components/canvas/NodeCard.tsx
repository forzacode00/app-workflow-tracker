import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { memo } from "react";
import { NODE_META, type FlowNode, type NodeType } from "@/lib/flow";
import { cn } from "@/lib/utils";
import { TYPE_CLASS } from "./typeClass";

export type CardNode = Node<{ node: FlowNode; onGrow: (fromId: string, type: NodeType) => void }, "boks">;

/* Håndtakene er 16 px med mus og 24 px på berøring. Trykkflaten rundt er større via ::before i index.css. */
const HANDLE = "!size-4 !border-2 !border-card !bg-muted-foreground pointer-coarse:!size-6";

/** Én boks på lerretet: type øverst, tittel, og en «+» i hjørnet som lar kartet vokse fra boksen. */
export const NodeCard = memo(function NodeCard({ data, selected }: NodeProps<CardNode>) {
  const { node, onGrow } = data;
  const meta = NODE_META[node.type];
  const grow = meta.next[0];
  return (
    <div
      className={cn(
        "group relative w-[220px] rounded-md border-2 bg-card px-3 py-2 text-card-foreground shadow-sm transition-shadow",
        TYPE_CLASS[node.type],
        node.type === "sporsmal" && "border-dashed",
        selected ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : "hover:shadow-md",
      )}
    >
      <Handle type="target" position={Position.Left} className={HANDLE} title="Slipp en pil her for å koble til boksen" />
      <span className="block text-[10.5px] font-semibold tracking-[0.08em] uppercase">{meta.label}</span>
      <span className={cn("line-clamp-3 block text-sm leading-snug font-medium text-card-foreground", !node.tittel && "text-muted-foreground italic")}>
        {node.tittel || meta.placeholder}
      </span>
      {node.notat && <span className="mt-0.5 line-clamp-2 block text-xs text-secondary-foreground">{node.notat}</span>}
      <Handle type="source" position={Position.Right} className={HANDLE} title="Trekk herfra for å koble til en annen boks" />
      {grow && (
        <button
          type="button"
          aria-label={`Legg til ${NODE_META[grow].label.toLowerCase()} etter ${node.tittel || meta.label}`}
          title={`+ ${NODE_META[grow].label}`}
          onClick={(e) => {
            e.stopPropagation();
            onGrow(node.id, grow);
          }}
          className={cn(
            "nodrag absolute -top-3.5 -right-3.5 flex size-8 items-center justify-center rounded-full border border-border bg-card text-lg leading-none text-foreground shadow-sm transition-opacity pointer-coarse:size-11 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            selected
              ? "opacity-100"
              : "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100",
          )}
        >
          +
        </button>
      )}
    </div>
  );
});
