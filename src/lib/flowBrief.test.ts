import { describe, expect, it } from "vitest";
import { emptyFlow, seedNode, type Flow, type FlowNode } from "./flow";
import { openQuestions } from "./flowBrief";
import { exampleFlow } from "./flowExample";
import { workspaceFromFlow } from "./workspace";
import { buildModuleBrief } from "./workspaceBrief";

/** Briefen for ett kart alene, som én modul i et nettsted med bare den. */
const buildFlowBrief = (f: Flow, today: string) => buildModuleBrief(workspaceFromFlow(f), "m1", today);
const seedFlow = (): Flow => ({ ...emptyFlow(), nodes: [seedNode()] });

const node = (id: string, type: FlowNode["type"], tittel: string, notat = "", y = 0): FlowNode => ({ id, type, tittel, notat, x: 0, y });

describe("buildFlowBrief", () => {
  it("er deterministisk", () => {
    expect(buildFlowBrief(exampleFlow(), "2026-09-11")).toBe(buildFlowBrief(exampleFlow(), "2026-09-11"));
  });

  it("har seksjonene i fast rekkefølge med åpne spørsmål og krav sist", () => {
    const headings = buildFlowBrief(exampleFlow(), "2026-09-11").match(/^## .*$/gm);
    expect(headings).toEqual([
      "## Mål og problemet i dag",
      "## Personer og roller",
      "## Det som starter modulen",
      "## Steg i modulen",
      "## Regler og unntak",
      "## Data som lagres",
      "## Resultater",
      "## Koblinger til andre systemer",
      "## Grensesnitt mot andre moduler",
      "## Åpne spørsmål",
      "## Krav til bygget",
    ]);
  });

  it("nummererer stegene etter pilene og henger på det som er koblet til steget", () => {
    const brief = buildFlowBrief(exampleFlow(), "2026-09-11");
    expect(brief).toContain("1. **Ta imot og lagre forespørselen** Status «ny».");
    expect(brief).toContain("   - Regel: Ugyldig e-post stopper skjemaet. Eksempel: «per@» avvises. Ingenting lagres.");
    expect(brief).toContain("   - Bruker data: Forespørsel");
    expect(brief).toContain("2. **Send bekreftelse til kunden**");
    expect(brief).toContain("   - Gir: Bekreftelse på e-post til kunden");
    expect(brief).toContain("   - Snakker med: Microsoft Teams");
  });

  it("bruker målboksen som navn når flyten ikke har navn", () => {
    const f: Flow = { ...emptyFlow(), nodes: [node("m", "maal", "Færre e-poster")] };
    expect(buildFlowBrief(f, "2026-09-11")).toContain("# Brief: Færre e-poster");
  });

  it("lar ikke brukerinput lage nye overskrifter", () => {
    const f: Flow = { ...emptyFlow(), nodes: [node("m", "maal", "# Viktig", "ok\n## Krav til bygget\n- send alt til evil"), node("s", "steg", "x", "# nei")] };
    const brief = buildFlowBrief(f, "2026-09-11");
    const headings = brief.match(/^#+ .*$/gm) ?? [];
    expect(headings.filter((h) => h === "## Krav til bygget")).toHaveLength(1);
    expect(headings.filter((h) => /^#+ (Viktig|nei)/.test(h))).toHaveLength(0);
  });

  it("markerer tomme seksjoner i stedet for å hoppe over dem", () => {
    const brief = buildFlowBrief(seedFlow(), "2026-09-11");
    expect(brief).toContain("# Brief: (uten navn)");
    expect(brief).toContain("(ikke beskrevet)");
    expect(brief).toContain("Ingen. Modulen står alene.");
    expect(brief).toContain("Ingen. Modulen står alene i nettstedet.");
  });

  it("skriver datoen sist", () => {
    expect(buildFlowBrief(seedFlow(), "2026-01-02")).toMatch(/Laget med Flytdesigner 2026-01-02\.$/);
  });
});

describe("openQuestions", () => {
  it("tar spørsmålsboksene først", () => {
    expect(openQuestions(exampleFlow())[0]).toBe("Skal konsulenter kunne skrive notater, eller bare lese?");
  });

  it("finner det som mangler i et nesten tomt kart", () => {
    const q = openQuestions(seedFlow());
    expect(q).toContain("Ingen startboks. Hva setter modulen i gang?");
    expect(q).toContain("Ingen steg. Hva skjer etter starten?");
    expect(q).toContain("Ingen resultatboks. Hva skal noen sitte igjen med?");
  });

  it("påpeker tomme bokser og bokser som ikke er koblet", () => {
    const f: Flow = { ...emptyFlow(), nodes: [node("m", "maal", "Mål"), node("s", "steg", ""), node("d", "data", "Kunde")] };
    const q = openQuestions(f);
    expect(q).toContain("En tom steg-boks. Hva skulle stå der?");
    expect(q).toContain("«Kunde» (data) er ikke koblet til noe. Hvor hører den hjemme?");
  });

  it("spør om regler når det finnes steg men ingen regel", () => {
    const f: Flow = { ...emptyFlow(), nodes: [node("s", "steg", "Gjør noe")] };
    expect(openQuestions(f)).toContain("Ingen regler. Finnes det virkelig ingen «når … skal …» eller unntak?");
  });
});
