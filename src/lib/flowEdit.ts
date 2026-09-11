import { MAX_EDGES, newId, type Flow, type FlowEdge, type FlowNode, type NodeType } from "./flow";

/** Bokser som henger på et steg. Legger man til noe fra en slik boks, festes det nye på steget den henger på. */
export const LEAF: readonly NodeType[] = ["regel", "sporsmal", "resultat", "system", "data"];
export const ANCHOR: readonly NodeType[] = ["steg", "start", "maal"];

/** Steget en bladboks henger på: den som peker inn i boksen, ellers den boksen peker på. */
export function anchorOf(flow: Flow, node: FlowNode): FlowNode | undefined {
  if (!LEAF.includes(node.type)) return undefined;
  const find = (ids: string[]) => flow.nodes.find((n) => ids.includes(n.id) && ANCHOR.includes(n.type));
  return find(flow.edges.filter((e) => e.to === node.id).map((e) => e.from)) ?? find(flow.edges.filter((e) => e.from === node.id).map((e) => e.to));
}

/**
 * Sy kjeden sammen når bokser fjernes: alle som pekte inn i noe fjernet, pekes videre til
 * første beholdte boks bak det, også gjennom flere fjernede bokser. Holder seg under MAX_EDGES.
 */
export function stitch(edges: FlowEdge[], gone: Set<string>): FlowEdge[] {
  const kept = edges.filter((e) => !gone.has(e.from) && !gone.has(e.to));
  const exits = (id: string, seen = new Set<string>()): string[] => {
    if (seen.has(id)) return [];
    seen.add(id);
    return edges.filter((e) => e.from === id).flatMap((e) => (gone.has(e.to) ? exits(e.to, seen) : [e.to]));
  };
  const extra: FlowEdge[] = [];
  const have = new Set(kept.map((e) => `${e.from}>${e.to}`));
  for (const id of gone) {
    const ins = edges.filter((e) => e.to === id && !gone.has(e.from)).map((e) => e.from);
    if (!ins.length) continue;
    const outs = exits(id);
    for (const a of ins) {
      for (const b of outs) {
        const key = `${a}>${b}`;
        if (a === b || have.has(key)) continue;
        have.add(key);
        extra.push({ id: newId("e"), from: a, to: b });
      }
    }
  }
  return [...kept, ...extra].slice(0, MAX_EDGES);
}
