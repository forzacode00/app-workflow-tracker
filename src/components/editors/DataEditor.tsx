import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { WorkflowActions } from "@/hooks/useWorkflow";
import { STORAGE_OPTIONS } from "@/lib/types";
import { EmptyList, ItemCard } from "./ItemCard";

type Props = Pick<WorkflowActions, "workflow" | "updateItem" | "removeItem">;

export function DataEditor({ workflow, updateItem, removeItem }: Props) {
  if (!workflow.data.length) {
    return <EmptyList text="Ingen datatyper ennå. Hva må huskes etter at flyten er kjørt?" />;
  }
  return (
    <div className="flex flex-col gap-2.5">
      {workflow.data.map((item, i) => (
        <ItemCard
          key={i}
          onRemove={() => removeItem("data", i)}
          removeLabel={`Fjern datatype ${item.entitet || i + 1}`}
          foot={
            <Input
              aria-label="Hvem eier dataene"
              placeholder="Hvem eier dataene (rolle)"
              value={item.eier}
              onChange={(e) => updateItem("data", i, { eier: e.target.value })}
            />
          }
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              aria-label="Hva er det"
              placeholder="Hva er det? F.eks. Forespørsel"
              value={item.entitet}
              onChange={(e) => updateItem("data", i, { entitet: e.target.value })}
            />
            <Select
              aria-label="Hvor lagres det"
              placeholder="Hvor lagres det"
              options={STORAGE_OPTIONS}
              value={item.lagring}
              onChange={(e) => updateItem("data", i, { lagring: e.target.value as typeof item.lagring })}
            />
          </div>
          <Input
            aria-label="Felter"
            placeholder="Felter, kommaseparert"
            value={item.felter}
            onChange={(e) => updateItem("data", i, { felter: e.target.value })}
          />
        </ItemCard>
      ))}
    </div>
  );
}
