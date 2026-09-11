import { z } from "zod";
import { flowEdgeSchema, flowNodeSchema, MAX_COORD, MAX_EDGES, MAX_NODES, newId, seedNode, SHORT, tidyEdges, uniqueIds, type Flow, type FlowNode } from "./flow";

/**
 * Et nettsted er alle modulene som til sammen blir ett produkt eller økosystem.
 * Hver modul er et kart (samme form som `Flow`), med egen id og plass i oversikten.
 */
export const MAX_MODULES = 50;

const idSchema = z.string().min(1).max(40);
const coord = z.number().finite().min(-MAX_COORD).max(MAX_COORD);

export const moduleSchema = z
  .object({
    id: idSchema,
    navn: z.string().max(SHORT),
    nodes: z.array(flowNodeSchema).max(MAX_NODES),
    edges: z.array(flowEdgeSchema).max(MAX_EDGES),
    eksempel: z.boolean().default(false),
    /** Plass i oversikten. */
    x: coord.default(0),
    y: coord.default(0),
  })
  .superRefine((m, ctx) => {
    uniqueIds(m.nodes, ctx, "nodes");
    uniqueIds(m.edges, ctx, "edges");
  });

export const workspaceSchema = z
  .object({
    versjon: z.literal(3),
    moduler: z.array(moduleSchema).min(1).max(MAX_MODULES),
    /** Id-en til modulen som er åpen. */
    aktiv: idSchema,
  })
  .superRefine((ws, ctx) => {
    const seen = new Set<string>();
    ws.moduler.forEach((m, i) => {
      if (seen.has(m.id)) ctx.addIssue({ code: "custom", message: "Samme modul-id brukes to ganger", path: ["moduler", i, "id"] });
      seen.add(m.id);
    });
    if (!seen.has(ws.aktiv)) ctx.addIssue({ code: "custom", message: "Aktiv modul finnes ikke", path: ["aktiv"] });
  });

export type Module = z.infer<typeof moduleSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;

/** Bokstypene som kan peke på en annen modul. */
export const REF_TYPES = ["start", "resultat", "system"] as const;
export const canRef = (type: FlowNode["type"]): boolean => (REF_TYPES as readonly string[]).includes(type);

/* Modulkortet er 280 px bredt; 280 px luft gir plass til pil og etikett uten overlapp. */
export const OVERVIEW_OFFSET_X = 560;
export const OVERVIEW_OFFSET_Y = 240;

export const newModuleId = (): string => newId("m");

/** Ny, tom modul med én målboks. */
export const seedModule = (id = newModuleId(), navn = ""): Module => ({
  id,
  navn,
  nodes: [seedNode()],
  edges: [],
  eksempel: false,
  x: 0,
  y: 0,
});

export const seedWorkspace = (): Workspace => {
  const m = seedModule("m1");
  return { versjon: 3, moduler: [m], aktiv: m.id };
};

/** Løfter ett kart (v2) til et nettsted med én modul. Referanser fra et fremmed nettsted fjernes. */
export const workspaceFromFlow = (flow: Flow, id = "m1"): Workspace => ({
  versjon: 3,
  moduler: [{ id, navn: flow.navn, nodes: flow.nodes.map(stripRef), edges: flow.edges, eksempel: flow.eksempel, x: 0, y: 0 }],
  aktiv: id,
});

const stripRef = (n: FlowNode): FlowNode => {
  if (n.ref === undefined) return n;
  const { ref: _ref, ...rest } = n;
  return rest;
};

/** Modulen som `Flow`, til alt som bare ser ett kart (brief, lerret). */
export const asFlow = (m: Module): Flow => ({ versjon: 2, navn: m.navn, nodes: m.nodes, edges: m.edges, eksempel: m.eksempel });

export const activeModule = (ws: Workspace): Module => ws.moduler.find((m) => m.id === ws.aktiv) ?? ws.moduler[0]!;

export const moduleById = (ws: Workspace, id: string): Module | undefined => ws.moduler.find((m) => m.id === id);

export const moduleName = (m: Module | undefined): string => {
  if (!m) return "(ukjent modul)";
  if (m.navn.trim()) return m.navn.trim();
  const maal = m.nodes.find((n) => n.type === "maal");
  return maal?.tittel.trim() || "(uten navn)";
};

/** Fjerner referanser som ikke er lov (ukjent modul, seg selv, type som ikke kan peke), og rydder kanter. */
export function tidyWorkspace(ws: Workspace): Workspace {
  const ids = new Set(ws.moduler.map((m) => m.id));
  let changed = false;
  const badRef = (n: FlowNode, self: string) => n.ref !== undefined && (!canRef(n.type) || !ids.has(n.ref) || n.ref === self);
  const moduler = ws.moduler.map((m) => {
    const tidied = tidyEdges(asFlow(m));
    let nodes = m.nodes;
    if (m.nodes.some((n) => badRef(n, m.id))) {
      nodes = m.nodes.map((n) => (badRef(n, m.id) ? stripRef(n) : n));
      changed = true;
    }
    if (tidied.edges !== m.edges) changed = true;
    return tidied.edges !== m.edges || nodes !== m.nodes ? { ...m, nodes, edges: tidied.edges } : m;
  });
  const aktiv = ids.has(ws.aktiv) ? ws.aktiv : (ws.moduler[0]?.id ?? ws.aktiv);
  if (aktiv !== ws.aktiv) changed = true;
  return changed ? { ...ws, moduler, aktiv } : ws;
}

/** Ledig plass i oversikten: til høyre for den siste modulen, ny rad for hver fjerde. */
export function placeModule(ws: Workspace): { x: number; y: number } {
  const i = ws.moduler.length;
  return { x: (i % 4) * OVERVIEW_OFFSET_X, y: Math.floor(i / 4) * OVERVIEW_OFFSET_Y };
}

export type Retning = "sender" | "mottar" | "begge" | "ukjent";

export type Interface = {
  /** Modulen som eier boksen. */
  fra: string;
  /** Modulen boksen peker på. */
  til: string;
  /** Boksen i `fra` som peker. */
  node: FlowNode;
  retning: Retning;
};

/** Alle koblinger mellom moduler, avledet fra bokser med `ref`. */
export function interfaces(ws: Workspace): Interface[] {
  const out: Interface[] = [];
  for (const m of ws.moduler) {
    for (const n of m.nodes) {
      if (!n.ref) continue;
      const inn = m.edges.some((e) => e.to === n.id);
      const ut = m.edges.some((e) => e.from === n.id);
      /* En start tar alltid imot, et resultat gir alltid fra seg. For et system avgjør pilene. */
      const retning: Retning =
        n.type === "start" ? "mottar" : n.type === "resultat" ? "sender" : inn && ut ? "begge" : inn ? "sender" : ut ? "mottar" : "ukjent";
      out.push({ fra: m.id, til: n.ref, node: n, retning });
    }
  }
  return out;
}

/** Kort sammendrag av en modul, til bruk i en annen moduls brief og i oversikten. */
export function moduleSummary(m: Module): { navn: string; maal: string; start: string[]; resultater: string[]; bokser: number } {
  const by = (t: FlowNode["type"]) => m.nodes.filter((n) => n.type === t && n.tittel.trim()).map((n) => n.tittel.trim());
  return {
    navn: moduleName(m),
    maal: m.nodes.find((n) => n.type === "maal")?.tittel.trim() ?? "",
    start: by("start"),
    resultater: by("resultat"),
    bokser: m.nodes.length,
  };
}
