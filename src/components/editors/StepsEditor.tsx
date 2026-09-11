import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { WorkflowActions } from "@/hooks/useWorkflow";
import { LONG } from "@/lib/types";
import { EmptyList, ItemCard } from "./ItemCard";

type Props = Pick<WorkflowActions, "workflow" | "updateItem" | "removeItem">;

export function StepsEditor({ workflow, updateItem, removeItem }: Props) {
  if (!workflow.steg.length) {
    return <EmptyList text="Ingen steg ennå. Hva er det første som skjer etter at flyten har startet?" />;
  }
  return (
    <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
      {workflow.steg.map((item, i) => {
        const id = `steg-${i}`;
        return (
          <li key={i}>
            <ItemCard
              onRemove={() => removeItem("steg", i)}
              removeLabel={`Fjern steg ${i + 1}`}
              foot={
                <Field id={`${id}-unntak`} label="Hva hvis det ikke går? Hva gjør dere da?" compact>
                  <Textarea
                    id={`${id}-unntak`}
                    className="min-h-14"
                    placeholder="F.eks. mangler data, blir avvist, feiler. Hva skjer da, og hvem får vite det?"
                    value={item.unntak}
                    onChange={(e) => updateItem("steg", i, { unntak: e.target.value })}
                  />
                </Field>
              }
            >
              <div className="grid grid-cols-[auto_1fr] items-end gap-2">
                <span className="pb-3 text-sm font-semibold text-muted-foreground tabular-nums">{i + 1}.</span>
                <Field id={`${id}-tittel`} label="Hva skjer i dette steget, og hvem gjør det?" compact>
                  <Input id={`${id}-tittel`} placeholder="F.eks. Salgsansvarlig setter status" value={item.tittel} onChange={(e) => updateItem("steg", i, { tittel: e.target.value })} />
                </Field>
              </div>
              <Field id={`${id}-beskrivelse`} label="Beskriv kort" compact>
                <Input id={`${id}-beskrivelse`} maxLength={LONG} placeholder="Ett eller to setninger" value={item.beskrivelse} onChange={(e) => updateItem("steg", i, { beskrivelse: e.target.value })} />
              </Field>
              <Field id={`${id}-regel`} label="Regel: når … skal … . Eksempel: …" compact>
                <Input
                  id={`${id}-regel`}
                  maxLength={LONG}
                  placeholder="F.eks. Når prisen er over 200 000 kr, skal daglig leder varsles. Eksempel: 250 000 kr gir to varsler."
                  value={item.regel}
                  onChange={(e) => updateItem("steg", i, { regel: e.target.value })}
                />
              </Field>
            </ItemCard>
          </li>
        );
      })}
    </ol>
  );
}
