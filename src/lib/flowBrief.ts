import { NODE_META, neighbours, orderedSteps, type Flow, type FlowNode, type NodeType } from "./flow";
import { block, inline, lines } from "./text";

const has = (v: string) => v.trim().length > 0;
const title = (n: FlowNode) => (has(n.tittel) ? inline(n.tittel) : "(uten tittel)");
const byType = (flow: Flow, type: NodeType) => flow.nodes.filter((n) => n.type === type);

/** «- Tittel: notat» for en boks, med notatet på egne innrykkede linjer hvis det er flerlinjet. */
function item(n: FlowNode): string[] {
  const noteLines = lines(n.notat);
  if (noteLines.length === 0) return [`- **${title(n)}**`];
  if (noteLines.length === 1) return [`- **${title(n)}**: ${inline(noteLines[0] ?? "")}`];
  return [`- **${title(n)}**`, ...noteLines.map((l) => `  - ${inline(l)}`)];
}

const listOf = (type: NodeType, emptyText: string) => (flow: Flow) => {
  const nodes = byType(flow, type);
  return nodes.length ? nodes.flatMap(item) : [emptyText];
};

/** Alt som er uavklart, samlet på ett sted. Spørsmålsboksene først, så det generatoren selv ser mangler. */
export function openQuestions(flow: Flow): string[] {
  const out = byType(flow, "sporsmal").map((q) => (has(q.tittel) ? inline(q.tittel) : inline(q.notat)) || "(tomt spørsmål)");
  const steps = orderedSteps(flow);
  if (byType(flow, "start").length === 0) out.push("Ingen startboks. Hva setter modulen i gang?");
  if (steps.length === 0) out.push("Ingen steg. Hva skjer etter starten?");
  if (byType(flow, "resultat").length === 0) out.push("Ingen resultatboks. Hva skal noen sitte igjen med?");
  if (byType(flow, "person").length === 0) out.push("Ingen personboks. Hvem bruker modulen, og hvem skal ikke se den?");
  if (steps.length > 0 && byType(flow, "data").length === 0) out.push("Ingen databoks. Hva må huskes fra ett steg til et annet?");
  if (steps.length > 0 && byType(flow, "regel").length === 0) out.push("Ingen regler. Finnes det virkelig ingen «når … skal …» eller unntak?");
  for (const n of flow.nodes) {
    if (!has(n.tittel) && !has(n.notat) && n.type !== "maal") out.push(`En tom ${NODE_META[n.type].label.toLowerCase()}-boks. Hva skulle stå der?`);
  }
  const connected = new Set(flow.edges.flatMap((e) => [e.from, e.to]));
  for (const n of flow.nodes) {
    if (n.type !== "maal" && n.type !== "sporsmal" && has(n.tittel) && !connected.has(n.id)) {
      out.push(`«${title(n)}» (${NODE_META[n.type].label.toLowerCase()}) er ikke koblet til noe. Hvor hører den hjemme?`);
    }
  }
  return out;
}

export type NextStep = { text: string; type: NodeType; /** Boksen det nye bør henge på, om noen. */ from?: string };

/**
 * Det ene neste steget i tankemodellen som mangler, i rekkefølgen mål → hvem → start → steg → regel → data → resultat.
 * Brukes som dytt i appen. Null når modulen har det viktigste.
 */
export function nextStep(flow: Flow): NextStep | null {
  const has = (t: NodeType) => byType(flow, t).some((n) => n.tittel.trim());
  const maal = byType(flow, "maal")[0];
  const steps = orderedSteps(flow);
  const last = steps[steps.length - 1];
  if (!maal || !maal.tittel.trim()) return null;
  if (!has("start")) return { text: "Hva setter det i gang?", type: "start", from: maal.id };
  if (!has("person")) return { text: "Hvem bruker det?", type: "person", from: maal.id };
  if (steps.length === 0) return { text: "Hva skjer først?", type: "steg", from: byType(flow, "start")[0]?.id ?? maal.id };
  if (steps.length < 2) return { text: "Hva skjer så?", type: "steg", from: last?.id };
  if (!has("regel")) return { text: "Er det noe som bare gjelder noen ganger? «Når … skal …»", type: "regel", from: last?.id };
  if (!has("data")) return { text: "Hva må huskes fra ett steg til et annet?", type: "data", from: last?.id };
  if (!has("resultat")) return { text: "Hva sitter noen igjen med til slutt?", type: "resultat", from: last?.id };
  return null;
}

const BUILD_REQUIREMENTS = [
  "List antakelsene dine og still maks fem spørsmål før du bygger. Bygg deretter, ikke vent på svar på alt.",
  "Skriv målet om til akseptansekriterier på formen «Gitt … når … så …», og lag én automatisk test per kriterium og per regel. Bruk verdiene i briefen som testdata.",
  "Systemene under «Koblinger» skal ikke endres. Les og skriv bare gjennom det som er beskrevet.",
  "Norsk bokmål i all tekst brukeren ser, «du»-form, korte verb-knapper.",
  "Mobil først (360 px) og tilgjengelig med tastatur og god kontrast.",
  "Hver liste har tom-, laste- og feiltilstand. Valider all input ved grensen.",
  "Personene i briefen bestemmer hvem som kan lese og endre lagrede data.",
  "Ferdig når modulen kjører fra start til resultat, alle tester er grønne, og du viser testresultatet. Lever en kort README.",
];

export type SectionId = "maal" | "person" | "start" | "steg" | "regel" | "data" | "resultat" | "system" | "grensesnitt" | "sporsmal" | "krav";
export type Section = { id: SectionId; title: string; body: (flow: Flow) => string[] };

/** Seksjonene i briefen, i rekkefølgen Claude leser dem. Data først, instruksjoner sist. */
export const SECTIONS: readonly Section[] = [
  {
    id: "maal",
    title: NODE_META.maal.briefTitle,
    body: (flow) => {
      const maal = byType(flow, "maal");
      return maal.length
        ? maal.flatMap((m) => [has(m.tittel) ? `**${inline(m.tittel)}**` : "", has(m.notat) ? block(m.notat) : ""].filter(Boolean))
        : ["(ikke beskrevet)"];
    },
  },
  { id: "person", title: NODE_META.person.briefTitle, body: listOf("person", "(ingen beskrevet)") },
  { id: "start", title: NODE_META.start.briefTitle, body: listOf("start", "(ikke beskrevet)") },
  {
    id: "steg",
    title: NODE_META.steg.briefTitle,
    body: (flow) => {
      const steps = orderedSteps(flow);
      if (steps.length === 0) return ["(ingen)"];
      return steps.flatMap((s, i) => {
        const out = [`${i + 1}. **${title(s)}**${has(s.notat) ? ` ${inline(s.notat)}` : ""}`];
        for (const n of neighbours(flow, s.id)) {
          if (n.type === "regel") out.push(`   - Regel: ${title(n)}${has(n.notat) ? `. ${inline(n.notat)}` : ""}`);
          if (n.type === "data") out.push(`   - Bruker data: ${title(n)}`);
          if (n.type === "resultat") out.push(`   - Gir: ${title(n)}`);
          if (n.type === "system") out.push(`   - Snakker med: ${title(n)}`);
          if (n.type === "person") out.push(`   - Utføres av: ${title(n)}`);
        }
        return out;
      });
    },
  },
  {
    id: "regel",
    title: NODE_META.regel.briefTitle,
    body: (flow) => {
      /* Regler som henger på et steg står under steget. Her bare de som ikke gjør det. */
      const loose = byType(flow, "regel").filter((r) => !neighbours(flow, r.id).some((n) => n.type === "steg"));
      const total = byType(flow, "regel").length;
      if (total === 0) return ["(ingen)"];
      return loose.length ? loose.flatMap(item) : ["Alle regler står under steget de hører til."];
    },
  },
  {
    id: "data",
    title: NODE_META.data.briefTitle,
    body: (flow) => {
      const data = byType(flow, "data");
      if (data.length === 0) return ["(ingen)"];
      return data.flatMap((d) => {
        const steg = neighbours(flow, d.id).filter((n) => n.type === "steg");
        return [...item(d), ...(steg.length ? [`  - Brukes i steg: ${steg.map(title).join("; ")}`] : ["  - Brukes ikke i noe steg. Hvem skriver og leser dette?"])];
      });
    },
  },
  {
    id: "resultat",
    title: NODE_META.resultat.briefTitle,
    body: (flow) => {
      const res = byType(flow, "resultat");
      if (res.length === 0) return ["(ingen)"];
      return res.flatMap((r) => {
        const til = neighbours(flow, r.id).filter((n) => n.type === "person");
        return [...item(r), ...(til.length ? [`  - Til: ${til.map(title).join("; ")}`] : [])];
      });
    },
  },
  { id: "system", title: NODE_META.system.briefTitle, body: listOf("system", "Ingen. Modulen står alene.") },
  {
    id: "sporsmal",
    title: "Åpne spørsmål",
    body: (flow) => {
      const q = openQuestions(flow);
      return q.length ? q.map((x) => `- ${x}`) : ["Ingen kjente. Si fra om du finner noen."];
    },
  },
  { id: "krav", title: "Krav til bygget", body: () => BUILD_REQUIREMENTS.map((r) => `- ${r}`) },
];

export const briefName = (flow: Flow): string => {
  const maal = byType(flow, "maal")[0];
  if (has(flow.navn)) return inline(flow.navn);
  if (maal && has(maal.tittel)) return inline(maal.tittel);
  return "(uten navn)";
};

/** Setter sammen en brief: tittel, innledning, seksjoner og dato. Deterministisk. */
export function renderBrief(name: string, intro: string, sections: readonly Section[], flow: Flow, today: string): string {
  const out: string[] = [`# Brief: ${name}`, "", intro];
  for (const s of sections) out.push("", `## ${s.title}`, "", ...s.body(flow));
  out.push("", "---", `Laget med Flytdesigner ${today}.`);
  return out.join("\n");
}
