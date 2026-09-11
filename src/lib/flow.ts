import { z } from "zod";

/** Bokstypene på lerretet. Rekkefølgen her er rekkefølgen i paletten og i briefen. */
export const NODE_TYPES = ["maal", "person", "start", "steg", "regel", "data", "resultat", "system", "sporsmal"] as const;
export type NodeType = (typeof NODE_TYPES)[number];

export type NodeMeta = {
  label: string;
  /** Kort hjelp som vises i sidepanelet. */
  hint: string;
  /** Plassholder for tittelen. */
  placeholder: string;
  /** Overskrift i briefen. */
  briefTitle: string;
  /** Hvilke typer det er naturlig å legge til fra denne boksen. Første er den «+» bruker. */
  next: readonly NodeType[];
};

export const NODE_META: Record<NodeType, NodeMeta> = {
  maal: {
    label: "Mål",
    hint: "Hva er problemet i dag, og hvordan vet dere at det er løst?",
    placeholder: "Hva vil du oppnå?",
    briefTitle: "Mål og problemet i dag",
    next: ["start", "person", "steg"],
  },
  person: {
    label: "Person",
    hint: "En rolle som bruker modulen. Intern eller ekstern? Må de logge inn? Hva ser og endrer de?",
    placeholder: "F.eks. Salgsansvarlig",
    briefTitle: "Personer og roller",
    next: ["start", "steg"],
  },
  start: {
    label: "Start",
    hint: "Det som setter modulen i gang: et skjema, en knapp, en e-post som kommer inn, et fast tidspunkt.",
    placeholder: "F.eks. Kunden sender inn skjema",
    briefTitle: "Det som starter modulen",
    next: ["steg", "data"],
  },
  steg: {
    label: "Steg",
    hint: "Én ting som skjer, og hvem som gjør det. Koble videre til neste steg.",
    placeholder: "F.eks. Salgsansvarlig setter status",
    briefTitle: "Steg i modulen",
    next: ["steg", "regel", "data", "resultat", "system"],
  },
  regel: {
    label: "Regel",
    hint: "«Når … skal …». Ta med et eksempel med tall, og hva som skjer hvis det ikke går.",
    placeholder: "F.eks. Over 200 000 kr varsles daglig leder",
    briefTitle: "Regler og unntak",
    next: ["steg", "resultat", "sporsmal"],
  },
  data: {
    label: "Data",
    hint: "Noe som må huskes: en forespørsel, et tilbud, en kunde. Hvilke felter, hvem eier det, hvilke statuser?",
    placeholder: "F.eks. Forespørsel",
    briefTitle: "Data som lagres",
    next: ["steg", "regel", "system"],
  },
  resultat: {
    label: "Resultat",
    hint: "Det noen sitter igjen med: en e-post, en PDF, en side, en rad i et regneark. Til hvem, og når?",
    placeholder: "F.eks. Bekreftelse til kunde",
    briefTitle: "Resultater",
    next: ["person", "system"],
  },
  system: {
    label: "System",
    hint: "En app dere allerede har, eller en annen modul i nettstedet. Henter vi data derfra, sender vi dit, eller begge? Claude får beskjed om ikke å endre det.",
    placeholder: "F.eks. Microsoft Teams",
    briefTitle: "Koblinger til andre systemer",
    next: ["steg", "data"],
  },
  sporsmal: {
    label: "Spørsmål",
    hint: "Noe dere ikke vet ennå. Claude spør om dette i stedet for å gjette.",
    placeholder: "F.eks. Skal konsulenter kunne skrive notater?",
    briefTitle: "Åpne spørsmål",
    next: [],
  },
};

export const SHORT = 200;
export const LONG = 4000;
export const MAX_NODES = 200;
export const MAX_EDGES = 400;
/** Lerretet er stort, men ikke uendelig. Utenfor dette kan ikke to bokser vises samtidig. */
export const MAX_COORD = 1_000_000;

const idSchema = z.string().min(1).max(40);
const coord = z.number().finite().min(-MAX_COORD).max(MAX_COORD);

export const flowNodeSchema = z.object({
  id: idSchema,
  type: z.enum(NODE_TYPES),
  tittel: z.string().max(SHORT),
  notat: z.string().max(LONG),
  x: coord,
  y: coord,
  /** Id-en til en annen modul boksen peker på (start, resultat og system). */
  ref: idSchema.optional(),
});

export const flowEdgeSchema = z.object({
  id: idSchema,
  from: idSchema,
  to: idSchema,
});

/** Zod-sjekk: ingen to elementer med samme id. Sti peker på den andre forekomsten. */
export const uniqueIds = (items: { id: string }[], ctx: z.RefinementCtx, path: string) => {
  const seen = new Set<string>();
  items.forEach((item, i) => {
    if (seen.has(item.id)) ctx.addIssue({ code: "custom", message: "Samme id brukes to ganger", path: [path, i, "id"] });
    seen.add(item.id);
  });
};

export const flowSchema = z
  .object({
    versjon: z.literal(2),
    navn: z.string().max(SHORT),
    nodes: z.array(flowNodeSchema).max(MAX_NODES),
    edges: z.array(flowEdgeSchema).max(MAX_EDGES),
    eksempel: z.boolean(),
  })
  .superRefine((f, ctx) => {
    uniqueIds(f.nodes, ctx, "nodes");
    uniqueIds(f.edges, ctx, "edges");
  });

export type FlowNode = z.infer<typeof flowNodeSchema>;
export type FlowEdge = z.infer<typeof flowEdgeSchema>;
export type Flow = z.infer<typeof flowSchema>;
export type Position = { x: number; y: number };

let counter = 0;
/** Kort, unik id. Tid + teller, så to bokser laget i samme millisekund ikke kolliderer. */
export const newId = (prefix = "n"): string => `${prefix}${Date.now().toString(36)}${(counter++).toString(36)}`;

export const emptyFlow = (): Flow => ({ versjon: 2, navn: "", nodes: [], edges: [], eksempel: false });

export const seedNode = (): FlowNode => ({ id: "maal", type: "maal", tittel: "", notat: "", x: 0, y: 0 });

export const isBlank = (f: Flow): boolean =>
  f.navn.trim() === "" && f.edges.length === 0 && f.nodes.every((n) => n.tittel.trim() === "" && n.notat.trim() === "");

/** Fjerner kanter som peker på bokser som ikke finnes, selvkoblinger og duplikater (både id og fra→til). */
export function tidyEdges(flow: Flow): Flow {
  const ids = new Set(flow.nodes.map((n) => n.id));
  const seenPair = new Set<string>();
  const seenId = new Set<string>();
  const edges = flow.edges.filter((e) => {
    if (!ids.has(e.from) || !ids.has(e.to) || e.from === e.to) return false;
    const key = `${e.from}>${e.to}`;
    if (seenPair.has(key) || seenId.has(e.id)) return false;
    seenPair.add(key);
    seenId.add(e.id);
    return true;
  });
  return edges.length === flow.edges.length ? flow : { ...flow, edges };
}

/** Bokser som er koblet til `id`, uansett retning. */
export function neighbours(flow: Flow, id: string): FlowNode[] {
  const ids = new Set<string>();
  for (const e of flow.edges) {
    if (e.from === id) ids.add(e.to);
    if (e.to === id) ids.add(e.from);
  }
  return flow.nodes.filter((n) => ids.has(n.id));
}

/** Avstand fra en boks til en ny boks som legges til fra den. */
export const OFFSET_X = 300;
export const OFFSET_Y = 160;

/** Finn en ledig plass til høyre for `from`, under bokser som allerede ligger der. Uten `from`: under nederste boks. */
export function placeNear(flow: Flow, from: FlowNode | undefined): Position {
  if (!from) {
    const maxY = flow.nodes.reduce((m, n) => Math.max(m, n.y), -OFFSET_Y);
    return { x: 0, y: maxY + OFFSET_Y };
  }
  const siblings = neighbours(flow, from.id).filter((n) => n.x >= from.x + OFFSET_X - 1);
  const y = siblings.length ? Math.max(...siblings.map((n) => n.y)) + OFFSET_Y : from.y;
  return { x: from.x + OFFSET_X, y };
}

/**
 * Stegene i rekkefølge. Følger pilene fra start (eller fra steg uten innkommende steg-pil),
 * og faller tilbake på plassering ovenfra og ned for det som ikke er koblet.
 */
export function orderedSteps(flow: Flow): FlowNode[] {
  const steps = flow.nodes.filter((n) => n.type === "steg");
  const stepIds = new Set(steps.map((s) => s.id));
  const byPosition = [...steps].sort((a, b) => a.y - b.y || a.x - b.x);
  const incoming = new Map<string, number>();
  for (const s of steps) incoming.set(s.id, 0);
  for (const e of flow.edges) {
    if (stepIds.has(e.from) && stepIds.has(e.to)) incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1);
  }
  const visited = new Set<string>();
  const out: FlowNode[] = [];
  const visit = (node: FlowNode) => {
    if (visited.has(node.id)) return;
    visited.add(node.id);
    out.push(node);
    const nextIds = flow.edges.filter((e) => e.from === node.id && stepIds.has(e.to)).map((e) => e.to);
    const next = byPosition.filter((s) => nextIds.includes(s.id));
    for (const n of next) visit(n);
  };
  for (const s of byPosition) if ((incoming.get(s.id) ?? 0) === 0) visit(s);
  for (const s of byPosition) visit(s);
  return out;
}
