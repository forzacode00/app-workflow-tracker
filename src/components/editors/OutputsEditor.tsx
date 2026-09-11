import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { WorkflowActions } from "@/hooks/useWorkflow";
import { LONG, OUTPUT_FORMATS } from "@/lib/types";
import { EmptyList, ItemCard } from "./ItemCard";

type Props = Pick<WorkflowActions, "workflow" | "updateItem" | "removeItem">;

export function OutputsEditor({ workflow, updateItem, removeItem }: Props) {
  if (!workflow.outputs.length) {
    return <EmptyList text="Ingenting ennå. Hva skal noen sitte igjen med når flyten er kjørt?" />;
  }
  return (
    <div className="flex flex-col gap-2.5">
      {workflow.outputs.map((item, i) => {
        const id = `output-${i}`;
        return (
          <ItemCard key={i} onRemove={() => removeItem("outputs", i)} removeLabel={`Fjern ${item.navn || `rad ${i + 1}`}`}>
            <div className="grid gap-2 sm:grid-cols-2">
              <Field id={`${id}-navn`} label="Hva kommer ut?" compact>
                <Input id={`${id}-navn`} placeholder="F.eks. Bekreftelse til kunde" value={item.navn} onChange={(e) => updateItem("outputs", i, { navn: e.target.value })} />
              </Field>
              <Field id={`${id}-format`} label="I hvilken form?" compact>
                <Select id={`${id}-format`} options={OUTPUT_FORMATS} value={item.format} onValueChange={(format) => updateItem("outputs", i, { format })} />
              </Field>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Field id={`${id}-mottaker`} label="Til hvem?" compact>
                <Input id={`${id}-mottaker`} placeholder="F.eks. Kunden" value={item.mottaker} onChange={(e) => updateItem("outputs", i, { mottaker: e.target.value })} />
              </Field>
              <Field id={`${id}-kanal`} label="Hvordan og når?" compact>
                <Input id={`${id}-kanal`} maxLength={LONG} placeholder="F.eks. rett etter innsending" value={item.kanal} onChange={(e) => updateItem("outputs", i, { kanal: e.target.value })} />
              </Field>
            </div>
          </ItemCard>
        );
      })}
    </div>
  );
}
