import { emptyFlow, LONG, MAX_NODES, SHORT, type Flow, type FlowEdge, type FlowNode, type NodeType } from "./flow";
import { clip, lines } from "./text";
import type { Workflow } from "./v1/types";

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
 * alt som ikke har egen bokstype havner i notatet på en boks. Tekst klippes til
 * lerretets grenser, og rader utover MAX_NODES samles som linjer i målboksens notat.
 */
export function migrateV1(w: Workflow): Flow {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  const rows: Partial<Record<NodeType, number>> = {};
  const overflow: string[] = [];
  let n = 0;

  const add = (type: NodeType, tittel: string, notat: string): FlowNode | null => {
    if (nodes.length >= MAX_NODES) {
      overflow.push(`${type}: ${tittel.trim()}${notat.trim() ? ` (${notat.trim()})` : ""}`);
      return null;
    }
    const row = rows[type] ?? 0;
    rows[type] = row + 1;
    const node: FlowNode = {
      id: `v1-${type}-${n++}`,
      type,
      tittel: clip(tittel.trim(), SHORT),
      notat: clip(notat.trim(), LONG),
      x: COL[type],
      y: row * ROW,
    };
    nodes.push(node);
    return node;
  };
  const link = (from: FlowNode | null, to: FlowNode | null) => {
    if (from && to) edges.push({ id: `e${from.id}-${to.id}`, from: from.id, to: to.id });
  };
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
  link(maal, start);

  const inputs = w.inputs
    .map((i) => add("data", `Inn: ${i.navn}`, joinNotes(i.type, i.kilde, i.pakrevd ? "Må fylles ut" : "", i.beskrivelse)))
    .filter((x): x is FlowNode => x !== null);
  for (const d of w.data) add("data", d.entitet, joinNotes(d.felter ? `Felter: ${d.felter}` : "", d.eier ? `Eier: ${d.eier}` : "", d.lagring, d.statuser ? `Statuser: ${d.statuser}` : ""));

  let prev: FlowNode | null = start;
  w.steg.forEach((s, idx) => {
    const step = add("steg", s.tittel || `Steg ${idx + 1}`, s.beskrivelse);
    link(prev ?? maal, step);
    if (idx === 0) for (const i of inputs) link(i, step);
    if (s.regel || s.unntak) link(step, add("regel", s.regel || "Unntak", s.unntak));
    if (step) prev = step;
  });

  for (const o of w.outputs) link(prev, add("resultat", o.navn, joinNotes(o.format, o.mottaker ? `Til: ${o.mottaker}` : "", o.kanal)));
  for (const k of w.koblinger) add("system", k.system, joinNotes(k.retning, k.hva, k.hvordan));
  for (const q of lines(w.ukjent)) add("sporsmal", q, "");

  if (overflow.length && maal) {
    maal.notat = clip(joinNotes(maal.notat, "Fikk ikke plass som egne bokser:", ...overflow), LONG);
  }

  return { ...emptyFlow(), navn: clip(w.navn, SHORT), nodes, edges, eksempel: w.eksempel };
}
