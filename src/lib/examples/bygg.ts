import { OFFSET_Y, type FlowEdge, type FlowNode, type NodeType } from "../flow";
import type { Module, Workspace } from "../workspace";

/**
 * Liten byggekloss for eksempelmoduler: beskriv innholdet, få bokser med plass og piler.
 * Kolonner: personer til venstre, mål i midten, start, steg (stablet), så det som henger på stegene.
 */
export type ModulSpec = {
  id: string;
  navn: string;
  maal: string;
  maalNotat?: string;
  personer?: [tittel: string, notat?: string][];
  start: { tittel: string; notat?: string; ref?: string };
  steg: StegSpec[];
  data?: [tittel: string, notat?: string][];
  systemer?: { tittel: string; notat?: string; ref?: string }[];
  sporsmal?: string[];
};

export type StegSpec = {
  tittel: string;
  notat?: string;
  regel?: [tittel: string, notat?: string];
  /** Hvilken databoks (indeks i `data`) steget bruker. */
  bruker?: number;
  resultat?: { tittel: string; notat?: string; ref?: string };
  /** Hvilket system (indeks i `systemer`) steget snakker med. */
  system?: number;
};

const COL = { person: -300, maal: 0, start: 300, steg: 600, heng: 900, ekstra: 1200 } as const;
const W_ROW = OFFSET_Y - 40;

export function bygg(spec: ModulSpec, plass: { x: number; y: number }): Module {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  let n = 0;
  const add = (type: NodeType, tittel: string, notat: string | undefined, x: number, y: number, ref?: string): FlowNode => {
    const node: FlowNode = { id: `${spec.id}-${type}-${n++}`, type, tittel, notat: notat ?? "", x, y, ...(ref ? { ref } : {}) };
    nodes.push(node);
    return node;
  };
  let k = 0;
  const link = (a: FlowNode, b: FlowNode) => edges.push({ id: `${spec.id}-e${k++}`, from: a.id, to: b.id });

  const maal = add("maal", spec.maal, spec.maalNotat, COL.maal, 0);
  (spec.personer ?? []).forEach(([t, notat], i) => link(maal, add("person", t, notat, COL.person, (i - 0.5) * W_ROW)));
  const start = add("start", spec.start.tittel, spec.start.notat, COL.start, 0, spec.start.ref);
  link(maal, start);

  const data = (spec.data ?? []).map(([t, notat], i) => add("data", t, notat, COL.ekstra, (spec.steg.length + i) * W_ROW));
  const systemer = (spec.systemer ?? []).map((s, i) => add("system", s.tittel, s.notat, COL.start, -(i + 1) * W_ROW, s.ref));

  let prev = start;
  let hengRow = 0;
  spec.steg.forEach((s, i) => {
    const steg = add("steg", s.tittel, s.notat, COL.steg, i * W_ROW);
    link(prev, steg);
    prev = steg;
    if (s.regel) link(steg, add("regel", s.regel[0], s.regel[1], COL.heng, hengRow++ * W_ROW));
    if (s.resultat) link(steg, add("resultat", s.resultat.tittel, s.resultat.notat, COL.heng, hengRow++ * W_ROW, s.resultat.ref));
    if (s.bruker !== undefined && data[s.bruker]) link(steg, data[s.bruker]!);
    if (s.system !== undefined && systemer[s.system]) link(steg, systemer[s.system]!);
  });
  (spec.sporsmal ?? []).forEach((q, i) => add("sporsmal", q, undefined, COL.person, (spec.personer?.length ?? 0) * W_ROW + i * W_ROW + 40));

  return { id: spec.id, navn: spec.navn, nodes, edges, eksempel: true, x: plass.x, y: plass.y };
}

export const nettsted = (moduler: Module[]): Workspace => ({ versjon: 3, moduler, aktiv: moduler[0]!.id });
