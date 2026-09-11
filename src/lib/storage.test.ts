import { describe, expect, it } from "vitest";
import { exampleWorkflow } from "./example";
import { loadWorkflow, parseWorkflow, saveWorkflow, serializeWorkflow, STORAGE_KEY } from "./storage";
import { emptyWorkflow } from "./types";

const memoryStorage = () => {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    map,
  };
};

describe("parseWorkflow", () => {
  it("gir feil på tekst som ikke er JSON", () => {
    const r = parseWorkflow("{ikke json");
    expect(r.ok).toBe(false);
  });

  it("gir feil på JSON som ikke er et objekt", () => {
    expect(parseWorkflow("[1,2]").ok).toBe(false);
    expect(parseWorkflow("null").ok).toBe(false);
  });

  it("fyller inn manglende felter fra tom flyt", () => {
    const r = parseWorkflow(JSON.stringify({ navn: "Test" }));
    expect(r.ok && r.workflow.navn).toBe("Test");
    expect(r.ok && r.workflow.inputs).toEqual([]);
  });

  it("avviser ugyldige valg i enum-felt", () => {
    const r = parseWorkflow(JSON.stringify({ triggerType: "Noe helt annet" }));
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toContain("triggerType");
  });

  it("avviser for lange tekster", () => {
    const r = parseWorkflow(JSON.stringify({ navn: "x".repeat(201) }));
    expect(r.ok).toBe(false);
  });

  it("fjerner ukjente felter", () => {
    const r = parseWorkflow(JSON.stringify({ navn: "Test", hemmelig: "nei" }));
    expect(r.ok && "hemmelig" in r.workflow).toBe(false);
  });
});

describe("lagring", () => {
  it("lagrer og leser tilbake identisk flyt", () => {
    const s = memoryStorage();
    const w = exampleWorkflow();
    expect(saveWorkflow(w, s)).toBe(true);
    expect(loadWorkflow(s)).toEqual(w);
  });

  it("returnerer null når ingenting er lagret", () => {
    expect(loadWorkflow(memoryStorage())).toBeNull();
  });

  it("krasjer ikke på korrupt lagret verdi", () => {
    const s = memoryStorage();
    s.setItem(STORAGE_KEY, "{korrupt");
    expect(loadWorkflow(s)).toBeNull();
  });

  it("fungerer uten lagring (null)", () => {
    expect(saveWorkflow(emptyWorkflow(), null)).toBe(false);
    expect(loadWorkflow(null)).toBeNull();
  });

  it("eksport og import gir identisk tilstand", () => {
    const w = exampleWorkflow();
    const r = parseWorkflow(serializeWorkflow(w));
    expect(r.ok && r.workflow).toEqual(w);
  });
});
