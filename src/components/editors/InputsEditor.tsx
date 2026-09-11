import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { WorkflowActions } from "@/hooks/useWorkflow";
import { INPUT_SOURCES, INPUT_TYPES } from "@/lib/types";
import { EmptyList, ItemCard } from "./ItemCard";

type Props = Pick<WorkflowActions, "workflow" | "updateItem" | "removeItem">;

export function InputsEditor({ workflow, updateItem, removeItem }: Props) {
  if (!workflow.inputs.length) {
    return <EmptyList text="Ingen inputs ennå. Hva må noen skrive inn eller sende for at flyten skal starte?" />;
  }
  return (
    <div className="flex flex-col gap-2.5">
      {workflow.inputs.map((item, i) => (
        <ItemCard
          key={i}
          onRemove={() => removeItem("inputs", i)}
          removeLabel={`Fjern input ${item.navn || i + 1}`}
          foot={
            <label className="flex items-center gap-2 text-sm text-secondary-foreground">
              <input
                type="checkbox"
                className="size-[18px] accent-primary"
                checked={item.pakrevd}
                onChange={(e) => updateItem("inputs", i, { pakrevd: e.target.checked })}
              />
              Påkrevd
            </label>
          }
        >
          <div className="grid gap-2 sm:grid-cols-[1.2fr_0.8fr_0.8fr]">
            <Input
              aria-label="Feltnavn"
              placeholder="Feltnavn"
              value={item.navn}
              onChange={(e) => updateItem("inputs", i, { navn: e.target.value })}
            />
            <Select
              aria-label="Type"
              placeholder="Type"
              options={INPUT_TYPES}
              value={item.type}
              onChange={(e) => updateItem("inputs", i, { type: e.target.value as typeof item.type })}
            />
            <Select
              aria-label="Kilde"
              placeholder="Kilde"
              options={INPUT_SOURCES}
              value={item.kilde}
              onChange={(e) => updateItem("inputs", i, { kilde: e.target.value as typeof item.kilde })}
            />
          </div>
          <Input
            aria-label="Regler eller merknad"
            placeholder="Regler eller merknad, f.eks. maks lengde"
            value={item.beskrivelse}
            onChange={(e) => updateItem("inputs", i, { beskrivelse: e.target.value })}
          />
        </ItemCard>
      ))}
    </div>
  );
}
