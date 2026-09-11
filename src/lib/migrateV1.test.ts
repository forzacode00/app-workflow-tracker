import { describe, expect, it } from "vitest";
import { exampleWorkflow } from "./example";
import { flowSchema, orderedSteps } from "./flow";
import { migrateV1 } from "./migrateV1";
import { emptyWorkflow } from "./types";

describe("migrateV1", () => {
  it("gir et gyldig kart uten løse kanter", () => {
    const f = migrateV1(exampleWorkflow());
    expect(flowSchema.safeParse(f).success).toBe(true);
    const ids = new Set(f.nodes.map((n) => n.id));
    expect(f.edges.every((e) => ids.has(e.from) && ids.has(e.to))).toBe(true);
    expect(new Set(f.nodes.map((n) => n.id)).size).toBe(f.nodes.length);
  });

  it("beholder navn, eksempel-flagg og rekkefølgen på stegene", () => {
    const w = exampleWorkflow();
    const f = migrateV1(w);
    expect(f.navn).toBe(w.navn);
    expect(f.eksempel).toBe(true);
    expect(orderedSteps(f).map((n) => n.tittel)).toEqual(w.steg.map((s) => s.tittel));
  });

  it("lager én boks per person, input, data, resultat, system og spørsmål", () => {
    const w = exampleWorkflow();
    const f = migrateV1(w);
    const count = (t: string) => f.nodes.filter((n) => n.type === t).length;
    expect(count("person")).toBe(3);
    expect(count("data")).toBe(w.inputs.length + w.data.length);
    expect(count("resultat")).toBe(w.outputs.length);
    expect(count("system")).toBe(w.koblinger.length);
    expect(count("sporsmal")).toBe(2);
    expect(count("start")).toBe(1);
    expect(count("maal")).toBe(1);
  });

  it("legger regel og unntak som egen boks koblet fra steget", () => {
    const f = migrateV1(exampleWorkflow());
    const rule = f.nodes.find((n) => n.type === "regel" && n.tittel.startsWith("Når e-post mangler"));
    expect(rule).toBeDefined();
    expect(rule?.notat).toContain("Hvis konfigurasjonen fra portalen mangler");
    const step = f.nodes.find((n) => n.tittel === "Ta imot forespørsel");
    expect(f.edges.some((e) => e.from === step?.id && e.to === rule?.id)).toBe(true);
  });

  it("mister ikke problem, suksess og avgrensning", () => {
    const w = exampleWorkflow();
    const maal = migrateV1(w).nodes.find((n) => n.type === "maal");
    expect(maal?.notat).toContain(w.problem);
    expect(maal?.notat).toContain("Slik vet vi at det virker");
    expect(maal?.notat).toContain("Ikke med i første versjon");
  });

  it("tåler en tom flyt", () => {
    const f = migrateV1(emptyWorkflow());
    expect(f.nodes).toHaveLength(1);
    expect(f.nodes[0]?.type).toBe("maal");
    expect(f.edges).toHaveLength(0);
  });
});
