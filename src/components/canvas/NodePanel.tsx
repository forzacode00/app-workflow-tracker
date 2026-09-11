import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { FlowActions } from "@/hooks/useFlow";
import { NODE_META, NODE_TYPES, type FlowNode } from "@/lib/flow";
import { cn } from "@/lib/utils";
import { TYPE_CLASS } from "./typeClass";

type Props = { node: FlowNode; actions: Pick<FlowActions, "updateNode" | "addNode" | "removeNodes" | "select"> };

/** Panelet for den valgte boksen: tittel, notat, og knapper for å la kartet vokse videre. */
export function NodePanel({ node, actions }: Props) {
  const meta = NODE_META[node.type];
  const titleRef = useRef<HTMLInputElement>(null);
  const lastId = useRef<string | null>(null);

  /* Ny boks: sett fokus på tittelen så man kan skrive med en gang. */
  useEffect(() => {
    if (lastId.current !== node.id) {
      lastId.current = node.id;
      if (!node.tittel) titleRef.current?.focus();
    }
  }, [node.id, node.tittel]);

  return (
    <aside
      aria-label={`Rediger ${meta.label.toLowerCase()}`}
      className="flex max-h-[55vh] flex-col gap-3 overflow-y-auto border-t border-border bg-card p-4 lg:max-h-none lg:w-[340px] lg:border-t-0 lg:border-l"
    >
      <div className="flex items-start justify-between gap-2">
        <div className={cn("text-[11px] font-semibold tracking-[0.08em] uppercase", TYPE_CLASS[node.type].split(" ")[1])}>{meta.label}</div>
        <Button size="sm" variant="ghost" onClick={() => actions.select(null)} aria-label="Lukk panelet">
          Lukk
        </Button>
      </div>
      <p className="m-0 text-[13px] text-secondary-foreground">{meta.hint}</p>

      <Field id="node-tittel" label="Tittel">
        <Input ref={titleRef} id="node-tittel" placeholder={meta.placeholder} value={node.tittel} onChange={(e) => actions.updateNode(node.id, { tittel: e.target.value })} />
      </Field>
      <Field id="node-notat" label="Notat" hint="Valgfritt. Alt du vil Claude skal vite om denne boksen.">
        <Textarea id="node-notat" className="min-h-24" value={node.notat} onChange={(e) => actions.updateNode(node.id, { notat: e.target.value })} />
      </Field>
      <Field id="node-type" label="Type">
        <select
          id="node-type"
          className="min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          value={node.type}
          onChange={(e) => {
            const t = NODE_TYPES.find((x) => x === e.target.value);
            if (t) actions.updateNode(node.id, { type: t });
          }}
        >
          {NODE_TYPES.map((t) => (
            <option key={t} value={t}>
              {NODE_META[t].label}
            </option>
          ))}
        </select>
      </Field>

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

      <div className="mt-auto pt-2">
        <Button size="sm" variant="danger" onClick={() => actions.removeNodes([node.id])}>
          Fjern boksen
        </Button>
      </div>
    </aside>
  );
}
