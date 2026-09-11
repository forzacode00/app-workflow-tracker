import { interfaces, moduleById, moduleName, type Workspace } from "./workspace";

/** Én pil i oversikten, uten React Flow-avhengighet så den kan testes. */
export type OverviewEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
  /** Sant når minst ett av grensesnittene har kjent retning. Ukjent tegnes stiplet uten pilhode. */
  known: boolean;
};

/** Flere piler enn dette gjør oversikten uleselig og treg. Resten står i briefen for hele nettstedet. */
export const MAX_OVERVIEW_EDGES = 200;

/**
 * Kanter for oversikten. Retningen er dataenes. Flere grensesnitt samme vei mellom to moduler
 * slås sammen til én pil med opptil to etiketter og «+N».
 */
export function overviewEdges(ws: Workspace): OverviewEdge[] {
  const groups = new Map<string, { source: string; target: string; labels: string[]; known: boolean }>();
  const add = (source: string, target: string, label: string, known: boolean) => {
    const key = `${source}>${target}`;
    const g = groups.get(key) ?? { source, target, labels: [], known: false };
    g.labels.push(label);
    g.known = g.known || known;
    groups.set(key, g);
  };
  for (const i of interfaces(ws)) {
    const label = i.node.tittel.trim() || moduleName(moduleById(ws, i.til));
    if (i.retning === "ukjent") add(i.fra, i.til, label, false);
    if (i.retning === "sender" || i.retning === "begge") add(i.fra, i.til, label, true);
    if (i.retning === "mottar" || i.retning === "begge") add(i.til, i.fra, label, true);
  }
  return [...groups.entries()].map(([id, g]) => ({
    id,
    source: g.source,
    target: g.target,
    label: g.labels.length > 2 ? `${g.labels.slice(0, 2).join(" · ")} +${g.labels.length - 2}` : g.labels.join(" · "),
    known: g.known,
  }));
}
