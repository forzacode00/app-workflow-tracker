import { Checkbox } from "@/components/ui/Checkbox";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { WorkflowActions } from "@/hooks/useWorkflow";
import { INPUT_SOURCES, INPUT_TYPES, LONG } from "@/lib/types";
import { EmptyList, ItemCard } from "./ItemCard";

type Props = Pick<WorkflowActions, "workflow" | "updateItem" | "removeItem">;

export function InputsEditor({ workflow, updateItem, removeItem }: Props) {
  if (!workflow.inputs.length) {
    return <EmptyList text="Ingenting ennå. Hva må noen skrive inn eller sende for at flyten skal starte?" />;
  }
  return (
    <div className="flex flex-col gap-2.5">
      {workflow.inputs.map((item, i) => {
        const id = `input-${i}`;
        return (
          <ItemCard
            key={i}
            onRemove={() => removeItem("inputs", i)}
            removeLabel={`Fjern ${item.navn || `rad ${i + 1}`}`}
            foot={
              <Checkbox
                label="Må fylles ut"
                checked={item.pakrevd}
                onChange={(e) => updateItem("inputs", i, { pakrevd: e.target.checked })}
              />
            }
          >
            <div className="grid gap-2 sm:grid-cols-[1.2fr_0.8fr_0.8fr]">
              <Field id={`${id}-navn`} label="Hva heter feltet?" compact>
                <Input id={`${id}-navn`} placeholder="F.eks. Firmanavn" value={item.navn} onChange={(e) => updateItem("inputs", i, { navn: e.target.value })} />
              </Field>
              <Field id={`${id}-type`} label="Hva slags verdi?" compact>
                <Select id={`${id}-type`} options={INPUT_TYPES} value={item.type} onValueChange={(type) => updateItem("inputs", i, { type })} />
              </Field>
              <Field id={`${id}-kilde`} label="Hvor kommer det fra?" compact>
                <Select id={`${id}-kilde`} options={INPUT_SOURCES} value={item.kilde} onValueChange={(kilde) => updateItem("inputs", i, { kilde })} />
              </Field>
            </div>
            <Field id={`${id}-beskrivelse`} label="Regler eller merknad" compact>
              <Input
                id={`${id}-beskrivelse`}
                maxLength={LONG}
                placeholder="F.eks. maks 1000 tegn, eller «brukes til bekreftelse»"
                value={item.beskrivelse}
                onChange={(e) => updateItem("inputs", i, { beskrivelse: e.target.value })}
              />
            </Field>
          </ItemCard>
        );
      })}
    </div>
  );
}
