import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { WorkflowActions } from "@/hooks/useWorkflow";
import { OUTPUT_FORMATS } from "@/lib/types";
import { EmptyList, ItemCard } from "./ItemCard";

type Props = Pick<WorkflowActions, "workflow" | "updateItem" | "removeItem">;

export function OutputsEditor({ workflow, updateItem, removeItem }: Props) {
  if (!workflow.outputs.length) {
    return <EmptyList text="Ingen outputs ennå. Hva skal noen sitte igjen med?" />;
  }
  return (
    <div className="flex flex-col gap-2.5">
      {workflow.outputs.map((item, i) => (
        <ItemCard key={i} onRemove={() => removeItem("outputs", i)} removeLabel={`Fjern output ${item.navn || i + 1}`}>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              aria-label="Hva er outputen"
              placeholder="Hva er outputen"
              value={item.navn}
              onChange={(e) => updateItem("outputs", i, { navn: e.target.value })}
            />
            <Select
              aria-label="Format"
              placeholder="Format"
              options={OUTPUT_FORMATS}
              value={item.format}
              onChange={(e) => updateItem("outputs", i, { format: e.target.value as typeof item.format })}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              aria-label="Til hvem"
              placeholder="Til hvem"
              value={item.mottaker}
              onChange={(e) => updateItem("outputs", i, { mottaker: e.target.value })}
            />
            <Input
              aria-label="Hvordan og når"
              placeholder="Hvordan og når"
              value={item.kanal}
              onChange={(e) => updateItem("outputs", i, { kanal: e.target.value })}
            />
          </div>
        </ItemCard>
      ))}
    </div>
  );
}
