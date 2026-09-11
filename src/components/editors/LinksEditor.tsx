import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { WorkflowActions } from "@/hooks/useWorkflow";
import { LINK_DIRECTIONS, LONG } from "@/lib/types";
import { EmptyList, ItemCard } from "./ItemCard";

type Props = Pick<WorkflowActions, "workflow" | "updateItem" | "removeItem">;

export function LinksEditor({ workflow, updateItem, removeItem }: Props) {
  if (!workflow.koblinger.length) {
    return <EmptyList text="Ingen koblinger. Står flyten helt alene, eller henger den sammen med noe dere har?" />;
  }
  return (
    <div className="flex flex-col gap-2.5">
      {workflow.koblinger.map((item, i) => {
        const id = `kobling-${i}`;
        return (
          <ItemCard key={i} onRemove={() => removeItem("koblinger", i)} removeLabel={`Fjern ${item.system || `rad ${i + 1}`}`}>
            <div className="grid gap-2 sm:grid-cols-2">
              <Field id={`${id}-system`} label="Hvilket system, app eller flyt?" compact>
                <Input id={`${id}-system`} placeholder="F.eks. Microsoft Teams" value={item.system} onChange={(e) => updateItem("koblinger", i, { system: e.target.value })} />
              </Field>
              <Field id={`${id}-retning`} label="Hvilken vei går dataene?" compact>
                <Select id={`${id}-retning`} options={LINK_DIRECTIONS} value={item.retning} onValueChange={(retning) => updateItem("koblinger", i, { retning })} />
              </Field>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Field id={`${id}-hva`} label="Hvilke data?" compact>
                <Input id={`${id}-hva`} maxLength={LONG} placeholder="F.eks. varsel med lenke" value={item.hva} onChange={(e) => updateItem("koblinger", i, { hva: e.target.value })} />
              </Field>
              <Field id={`${id}-hvordan`} label="Hvordan, teknisk eller manuelt?" compact>
                <Input id={`${id}-hvordan`} maxLength={LONG} placeholder="F.eks. webhook, e-post, noen kopierer" value={item.hvordan} onChange={(e) => updateItem("koblinger", i, { hvordan: e.target.value })} />
              </Field>
            </div>
          </ItemCard>
        );
      })}
    </div>
  );
}
