import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import type { WorkflowActions } from "@/hooks/useWorkflow";
import { LONG, STORAGE_OPTIONS } from "@/lib/types";
import { EmptyList, ItemCard } from "./ItemCard";

type Props = Pick<WorkflowActions, "workflow" | "updateItem" | "removeItem">;

export function DataEditor({ workflow, updateItem, removeItem }: Props) {
  if (!workflow.data.length) {
    return <EmptyList text="Ingenting ennå. Hva må huskes etter at flyten er kjørt?" />;
  }
  return (
    <div className="flex flex-col gap-2.5">
      {workflow.data.map((item, i) => {
        const id = `data-${i}`;
        return (
          <ItemCard
            key={i}
            onRemove={() => removeItem("data", i)}
            removeLabel={`Fjern ${item.entitet || `rad ${i + 1}`}`}
            foot={
              <Field id={`${id}-eier`} label="Hvem eier dataene?" compact>
                <Input id={`${id}-eier`} placeholder="Rolle, f.eks. salgsansvarlig" value={item.eier} onChange={(e) => updateItem("data", i, { eier: e.target.value })} />
              </Field>
            }
          >
            <div className="grid gap-2 sm:grid-cols-2">
              <Field id={`${id}-entitet`} label="Hva er det?" compact>
                <Input id={`${id}-entitet`} placeholder="F.eks. Forespørsel" value={item.entitet} onChange={(e) => updateItem("data", i, { entitet: e.target.value })} />
              </Field>
              <Field id={`${id}-lagring`} label="Hvor lagres det?" compact>
                <Select id={`${id}-lagring`} options={STORAGE_OPTIONS} value={item.lagring} onValueChange={(lagring) => updateItem("data", i, { lagring })} />
              </Field>
            </div>
            <Field id={`${id}-felter`} label="Hva må vi vite om hver?" compact>
              <Input
                id={`${id}-felter`}
                maxLength={LONG}
                placeholder="Felter, kommaseparert. F.eks. firmanavn, pris, status, opprettet"
                value={item.felter}
                onChange={(e) => updateItem("data", i, { felter: e.target.value })}
              />
            </Field>
            <Field id={`${id}-statuser`} label="Statuser, rekkefølge og hvem som kan flytte den" compact>
              <Textarea
                id={`${id}-statuser`}
                className="min-h-14"
                placeholder="F.eks. ny → under arbeid → sendt. Bare salgsansvarlig flytter. Kan ikke gå tilbake til ny."
                value={item.statuser}
                onChange={(e) => updateItem("data", i, { statuser: e.target.value })}
              />
            </Field>
          </ItemCard>
        );
      })}
    </div>
  );
}
