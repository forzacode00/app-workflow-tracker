import { OFFSET_Y, type FlowEdge, type FlowNode, type NodeType } from "./flow";
import type { Module, Workspace } from "./workspace";

/**
 * Byggekloss for moduler fra en beskrivelse (eksemplene, og intervjuet): beskriv innholdet, få bokser med plass og piler.
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
  /** `leser: true` gir pil fra systemet inn i steget (vi henter derfra), ellers pil fra steget (vi sender dit). */
  systemer?: { tittel: string; notat?: string; ref?: string; leser?: boolean }[];
  sporsmal?: string[];
};

export type StegSpec = {
  tittel: string;
  notat?: string;
  regel?: [tittel: string, notat?: string];
  /** Flere regler på samme steg. */
  regler?: [tittel: string, notat?: string][];
  /** Hvem (indeks i `personer`) som utfører steget. */
  hvem?: number | number[];
  /** Hvilke databokser (indeks i `data`) steget bruker. */
  bruker?: number | number[];
  /** Resultatet steget gir. `til` er indeks i `personer` (hvem får det), `felter` er indeks i `data` (hva som sendes). */
  resultat?: { tittel: string; notat?: string; ref?: string; til?: number; felter?: number };
  /** Flere resultater fra samme steg. */
  resultater?: StegSpec["resultat"][];
  /** Hvilke systemer (indeks i `systemer`) steget snakker med. */
  system?: number | number[];
};

const COL = { person: -300, maal: 0, start: 300, steg: 600, heng: 900, ekstra: 1200 } as const;
const W_ROW = OFFSET_Y - 40;
const list = (v: number | number[] | undefined): number[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

export function bygg(spec: ModulSpec, plass: { x: number; y: number }, opts: { eksempel?: boolean } = {}): Module {
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
  const personer = (spec.personer ?? []).map(([t, notat], i) => add("person", t, notat, COL.person, (i - 0.5) * W_ROW));
  personer.forEach((p) => link(maal, p));
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
    for (const p of list(s.hvem)) if (personer[p]) link(steg, personer[p]!);
    for (const regel of [...(s.regel ? [s.regel] : []), ...(s.regler ?? [])]) link(steg, add("regel", regel[0], regel[1], COL.heng, hengRow++ * W_ROW));
    for (const res of [...(s.resultat ? [s.resultat] : []), ...(s.resultater ?? [])]) {
      if (!res) continue;
      const r = add("resultat", res.tittel, res.notat, COL.heng, hengRow++ * W_ROW, res.ref);
      link(steg, r);
      if (res.til !== undefined && personer[res.til]) link(r, personer[res.til]!);
      if (res.felter !== undefined && data[res.felter]) link(r, data[res.felter]!);
    }
    for (const d of list(s.bruker)) if (data[d]) link(steg, data[d]!);
    for (const sy of list(s.system)) {
      const sys = systemer[sy];
      if (!sys) continue;
      if (spec.systemer?.[sy]?.leser) link(sys, steg);
      else link(steg, sys);
    }
  });
  (spec.sporsmal ?? []).forEach((q, i) => add("sporsmal", q, undefined, COL.person, personer.length * W_ROW + i * W_ROW + 40));

  return { id: spec.id, navn: spec.navn, nodes, edges, eksempel: opts.eksempel ?? true, x: plass.x, y: plass.y };
}

export const nettsted = (moduler: Module[]): Workspace => ({ versjon: 3, moduler, aktiv: moduler[0]!.id });
