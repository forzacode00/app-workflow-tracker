import { Input } from "@/components/ui/Input";
import type { WorkflowActions } from "@/hooks/useWorkflow";
import { EmptyList, ItemCard } from "./ItemCard";

type Props = Pick<WorkflowActions, "workflow" | "updateItem" | "removeItem">;

export function StepsEditor({ workflow, updateItem, removeItem }: Props) {
  if (!workflow.steg.length) {
    return <EmptyList text="Ingen steg ennå. Hva er det første som skjer etter triggeren?" />;
  }
  return (
    <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
      {workflow.steg.map((item, i) => (
        <li key={i}>
          <ItemCard
            onRemove={() => removeItem("steg", i)}
            removeLabel={`Fjern steg ${i + 1}`}
            foot={
              <Input
                aria-label={`Regel for steg ${i + 1}`}
                placeholder="Regel: hvis … så … (valgfritt)"
                value={item.regel}
                onChange={(e) => updateItem("steg", i, { regel: e.target.value })}
              />
            }
          >
            <div className="grid grid-cols-[auto_1fr] items-center gap-2">
              <span className="text-sm font-semibold text-muted-foreground tabular-nums">{i + 1}.</span>
              <Input
                aria-label={`Steg ${i + 1}`}
                placeholder="Hva skjer i dette steget"
                value={item.tittel}
                onChange={(e) => updateItem("steg", i, { tittel: e.target.value })}
              />
            </div>
            <Input
              aria-label={`Beskrivelse av steg ${i + 1}`}
              placeholder="Beskriv kort"
              value={item.beskrivelse}
              onChange={(e) => updateItem("steg", i, { beskrivelse: e.target.value })}
            />
          </ItemCard>
        </li>
      ))}
    </ol>
  );
}
