import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import type { FlowActions } from "@/hooks/useWorkspace";
import { NODE_META, NODE_TYPES, type FlowNode } from "@/lib/flow";
import { cn } from "@/lib/utils";
import { canRef, moduleName, type Module } from "@/lib/workspace";
import { TYPE_CLASS } from "./typeClass";

type Props = {
  node: FlowNode;
  /** De andre modulene i nettstedet, som boksen kan peke på. */
  otherModules: Module[];
  actions: Pick<FlowActions, "updateNode" | "addNode" | "removeNodes" | "select">;
  onRemoved: (count: number) => void;
  onNewModule: () => void;
};

const TYPE_OPTIONS = NODE_TYPES.map((t) => ({ value: t, label: NODE_META[t].label }));
const NO_REF = "";

/** Panelet for den valgte boksen: tittel, modulkobling, «legg til etter», notat, type og fjern. */
export function NodePanel({ node, otherModules, actions, onRemoved, onNewModule }: Props) {
  const meta = NODE_META[node.type];
  const titleRef = useRef<HTMLInputElement>(null);
  const lastId = useRef<string | null>(null);

  /* Ny valgt boks: sett fokus på tittelen så man kan skrive med en gang. */
  useEffect(() => {
    if (lastId.current !== node.id) {
      lastId.current = node.id;
      titleRef.current?.focus();
      if (node.tittel) titleRef.current?.select();
    }
  }, [node.id, node.tittel]);

  const growType = meta.next[0];
  const refOptions = [{ value: NO_REF, label: "Nei" }, ...otherModules.map((m) => ({ value: m.id, label: moduleName(m) }))];
  const refLabel = node.type === "start" ? "Mottar fra en annen modul?" : node.type === "resultat" ? "Sender til en annen modul?" : "Snakker med en annen modul?";
  const refHint =
    node.type === "start"
      ? "Velg modulen som setter denne i gang. Det blir et grensesnitt i briefen, og en pil inn i oversikten."
      : node.type === "resultat"
        ? "Velg modulen som skal ta imot dette. Det blir et grensesnitt i briefen, og en pil ut i oversikten."
        : "Velg modulen. Pilene på lerretet avgjør om vi sender, mottar eller begge deler.";

  return (
    <aside
      aria-label={`Rediger ${meta.label.toLowerCase()}`}
      onKeyDown={(e) => {
        if (e.key === "Escape") actions.select(null);
      }}
      className="order-2 flex max-h-[45vh] flex-col gap-3 overflow-y-auto border-t border-border bg-card p-4 lg:max-h-none lg:w-[340px] lg:border-t-0 lg:border-l"
    >
      <div className="flex items-start justify-between gap-2">
        <div className={cn("text-[11px] font-semibold tracking-[0.08em] uppercase", TYPE_CLASS[node.type].split(" ")[1])}>{meta.label}</div>
        <Button size="sm" variant="ghost" onClick={() => actions.select(null)} aria-label="Lukk panelet">
          Lukk
        </Button>
      </div>
      <p className="m-0 text-[13px] text-secondary-foreground">{meta.hint}</p>

      <Field
        id="node-tittel"
        label="Tittel"
        hint={growType ? `Enter legger til ${NODE_META[growType].label.toLowerCase()} etter denne. Esc lukker.` : "Esc lukker."}
      >
        <Input
          ref={titleRef}
          id="node-tittel"
          placeholder={meta.placeholder}
          value={node.tittel}
          onChange={(e) => actions.updateNode(node.id, { tittel: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter" && growType) {
              e.preventDefault();
              actions.addNode(growType, node.id);
            }
          }}
        />
      </Field>

      {canRef(node.type) &&
        (otherModules.length ? (
          <Field id="node-ref" label={refLabel} hint={refHint}>
            <Select
              id="node-ref"
              options={refOptions}
              value={node.ref ?? NO_REF}
              onValueChange={(ref) => actions.updateNode(node.id, { ref: ref === NO_REF ? undefined : ref })}
            />
          </Field>
        ) : (
          <div className="flex flex-col gap-1.5 rounded-md border border-dashed border-input p-3">
            <span className="text-sm font-semibold text-secondary-foreground">{refLabel}</span>
            <span className="text-xs text-secondary-foreground">Når nettstedet har flere moduler, kan denne boksen peke på en av dem. Det blir et grensesnitt.</span>
            <div>
              <Button size="sm" onClick={onNewModule}>
                + Lag ny modul
              </Button>
            </div>
          </div>
        ))}

      {meta.next.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-secondary-foreground">Legg til etter denne</span>
          <div className="flex flex-wrap gap-1.5">
            {meta.next.map((t) => (
              <Button key={t} size="sm" onClick={() => actions.addNode(t, node.id)}>
                + {NODE_META[t].label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <Field id="node-notat" label="Notat" hint="Valgfritt. Alt du vil Claude skal vite om denne boksen.">
        <Textarea id="node-notat" className="min-h-24" value={node.notat} onChange={(e) => actions.updateNode(node.id, { notat: e.target.value })} />
      </Field>

      <details>
        <summary className="cursor-pointer text-sm font-semibold text-secondary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
          Endre type
        </summary>
        <div className="pt-2">
          <Select aria-label="Type" options={TYPE_OPTIONS} value={node.type} onValueChange={(type) => actions.updateNode(node.id, { type })} />
        </div>
      </details>

      <div className="mt-auto pt-2">
        <Button size="sm" variant="danger" onClick={() => onRemoved(actions.removeNodes([node.id]))}>
          Fjern boksen
        </Button>
      </div>
    </aside>
  );
}
