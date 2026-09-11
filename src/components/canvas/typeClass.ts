import type { FlowNode } from "@/lib/flow";

/** Farge per bokstype: ramme og liten overskrift. Tokens ligger i index.css. */
export const TYPE_CLASS: Record<FlowNode["type"], string> = {
  maal: "border-node-maal text-node-maal",
  person: "border-node-person text-node-person",
  start: "border-node-start text-node-start",
  steg: "border-node-steg text-node-steg",
  regel: "border-node-regel text-node-regel",
  data: "border-node-data text-node-data",
  resultat: "border-node-resultat text-node-resultat",
  system: "border-node-system text-node-system",
  sporsmal: "border-node-sporsmal text-node-sporsmal",
};
