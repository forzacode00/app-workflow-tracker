import { Button } from "@/components/ui/Button";
import { NODE_META, NODE_TYPES, type NodeType } from "@/lib/flow";
import { cn } from "@/lib/utils";
import { TYPE_CLASS } from "./typeClass";

type Props = { onAdd: (type: NodeType) => void; hasSelection: boolean };

/** Rad med bokstyper. Klikk legger til en boks, koblet fra den valgte hvis noen er valgt. */
export function Palette({ onAdd, hasSelection }: Props) {
  return (
    <div
      role="toolbar"
      aria-label={hasSelection ? "Legg til boks koblet fra den valgte" : "Legg til boks"}
      className="flex max-w-full gap-1.5 overflow-x-auto rounded-md border border-border bg-card p-1.5 shadow-sm"
    >
      {NODE_TYPES.map((t) => (
        <Button key={t} size="sm" variant="ghost" onClick={() => onAdd(t)} className={cn("shrink-0 gap-1.5", TYPE_CLASS[t].split(" ")[1])}>
          <span aria-hidden="true">+</span>
          {NODE_META[t].label}
        </Button>
      ))}
    </div>
  );
}
