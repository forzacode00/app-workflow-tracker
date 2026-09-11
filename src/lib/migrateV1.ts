import { lines } from "./text";
import { emptyFlow, type Flow, type FlowEdge, type FlowNode, type NodeType } from "./flow";
import type { Workflow } from "./types";

const COL: Record<NodeType, number> = {
  maal: 0,
  person: -360,
  start: 320,
  steg: 640,
  regel: 960,
  data: 640,
  resultat: 1280,
  system: 1600,
  sporsmal: -360,
};
const ROW = 110;

/**
 * Løfter en flyt fra det gamle skjemaet (v1) til lerretet (v2). Ingenting går tapt:
 * alt som ikke har egen bokstype havner i notatet på en boks.
 */
export function migrateV1(w: Workflow): Flow {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  const rows: Partial<Record<NodeType, number>> = {};
  let n = 0;

  const add = (type: NodeType, tittel: string, notat: string): FlowNode => {
    const row = rows[type] ?? 0;
    rows[type] = row + 1;
    const node: FlowNode = { id: `v1-${type}-${n++}`, type, tittel: tittel.trim(), notat: notat.trim(), x: COL[type], y: row * ROW };
    nodes.push(node);
    return node;
  };
  const link = (from: FlowNode, to: FlowNode) => edges.push({ id: `e${from.id}-${to.id}`, from: from.id, to: to.id });
  const joinNotes = (...parts: string[]) => parts.filter((p) => p.trim()).join("\n");

  const maal = add(
    "maal",
    w.navn || "Hva vil du oppnå?",
    joinNotes(w.problem, w.suksess ? `Slik vet vi at det virker:\n${w.suksess}` : "", w.avgrensning ? `Ikke med i første versjon: ${w.avgrensning}` : ""),
  );

  for (const line of lines(w.brukere)) {
    const [name, ...rest] = line.split(",");
    link(maal, add("person", name ?? line, rest.join(",")));
  }

  const start = w.trigger || w.triggerType ? add("start", w.trigger || w.triggerType, w.trigger ? w.triggerType : "") : null;
  if (start) link(maal, start);

  const inputs = w.inputs.map((i) =>
    add("data", `Inn: ${i.navn}`, joinNotes(i.type, i.kilde, i.pakrevd ? "Må fylles ut" : "", i.beskrivelse)),
  );
  for (const d of w.data) add("data", d.entitet, joinNotes(d.felter ? `Felter: ${d.felter}` : "", d.eier ? `Eier: ${d.eier}` : "", d.lagring, d.statuser ? `Statuser: ${d.statuser}` : ""));

  let prev: FlowNode | null = start;
  w.steg.forEach((s, idx) => {
    const step = add("steg", s.tittel || `Steg ${idx + 1}`, s.beskrivelse);
    if (prev) link(prev, step);
    else link(maal, step);
    if (idx === 0) for (const i of inputs) link(i, step);
    if (s.regel || s.unntak) link(step, add("regel", s.regel || "Unntak", s.unntak));
    prev = step;
  });

  for (const o of w.outputs) {
    const node = add("resultat", o.navn, joinNotes(o.format, o.mottaker ? `Til: ${o.mottaker}` : "", o.kanal));
    if (prev) link(prev, node);
  }
  for (const k of w.koblinger) add("system", k.system, joinNotes(k.retning, k.hva, k.hvordan));
  for (const q of lines(w.ukjent)) add("sporsmal", q, "");

  return { ...emptyFlow(), navn: w.navn, nodes, edges, eksempel: w.eksempel };
}
