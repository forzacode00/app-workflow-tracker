import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { WorkflowActions } from "@/hooks/useWorkflow";
import { LINK_DIRECTIONS } from "@/lib/types";
import { EmptyList, ItemCard } from "./ItemCard";

type Props = Pick<WorkflowActions, "workflow" | "updateItem" | "removeItem">;

export function LinksEditor({ workflow, updateItem, removeItem }: Props) {
  if (!workflow.koblinger.length) {
    return <EmptyList text="Ingen koblinger. Står flyten helt alene?" />;
  }
  return (
    <div className="flex flex-col gap-2.5">
      {workflow.koblinger.map((item, i) => (
        <ItemCard
          key={i}
          onRemove={() => removeItem("koblinger", i)}
          removeLabel={`Fjern kobling ${item.system || i + 1}`}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              aria-label="System, app eller flyt"
              placeholder="System, app eller flyt"
              value={item.system}
              onChange={(e) => updateItem("koblinger", i, { system: e.target.value })}
            />
            <Select
              aria-label="Retning"
              placeholder="Retning"
              options={LINK_DIRECTIONS}
              value={item.retning}
              onChange={(e) => updateItem("koblinger", i, { retning: e.target.value as typeof item.retning })}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              aria-label="Hvilke data"
              placeholder="Hvilke data"
              value={item.hva}
              onChange={(e) => updateItem("koblinger", i, { hva: e.target.value })}
            />
            <Input
              aria-label="Hvordan"
              placeholder="Hvordan, teknisk eller manuelt"
              value={item.hvordan}
              onChange={(e) => updateItem("koblinger", i, { hvordan: e.target.value })}
            />
          </div>
        </ItemCard>
      ))}
    </div>
  );
}
