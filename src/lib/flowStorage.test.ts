import { describe, expect, it } from "vitest";
import { seedFlow } from "./flow";
import { exampleFlow } from "./flowExample";
import { loadFlow, MAX_JSON_LENGTH, parseFlow, readBackup, saveFlow, serializeFlow, STORAGE_KEY, validateFlow } from "./flowStorage";
import { exampleWorkflow } from "./v1/example";
import { STORAGE_KEY as V1_KEY } from "./v1/storage";

const memoryStorage = () => {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    map,
  };
};

describe("parseFlow", () => {
  it("leser et lerret (v2) og rydder kanter", () => {
    const f = exampleFlow();
    f.edges.push({ id: "løs", from: "maal", to: "finnes-ikke" });
    const r = parseFlow(JSON.stringify(f));
    expect(r.ok && r.flow.edges.some((e) => e.id === "løs")).toBe(false);
    expect(r.ok && r.flow.nodes.length).toBe(f.nodes.length);
  });

  it("løfter et gammelt skjema (v1) til lerret, gjennom samme skjema", () => {
    const r = parseFlow(JSON.stringify(exampleWorkflow()));
    expect(r.ok && r.flow.versjon).toBe(2);
    expect(r.ok && r.flow.nodes.some((n) => n.type === "steg")).toBe(true);
  });

  it("avviser ugyldig JSON, feil form, for stor tekst og ukjent bokstype", () => {
    expect(parseFlow("{nei").ok).toBe(false);
    expect(parseFlow("[]").ok).toBe(false);
    expect(parseFlow("x".repeat(MAX_JSON_LENGTH + 1)).ok).toBe(false);
    const r = parseFlow(JSON.stringify({ versjon: 2, nodes: [{ id: "a", type: "ukjent", tittel: "", notat: "", x: 0, y: 0 }] }));
    expect(!r.ok && r.error).toContain("nodes.0.type");
  });

  it("avviser duplikate id-er med sti til raden", () => {
    const n = { type: "steg", tittel: "", notat: "", x: 0, y: 0 };
    const r = validateFlow({ versjon: 2, nodes: [{ ...n, id: "a" }, { ...n, id: "a" }] });
    expect(!r.ok && r.error).toContain("nodes.1.id");
  });

  it("fyller inn manglende toppnivåfelt", () => {
    const r = parseFlow(JSON.stringify({ versjon: 2 }));
    expect(r.ok && r.flow).toEqual({ versjon: 2, navn: "", nodes: [], edges: [], eksempel: false });
  });
});

describe("loadFlow og saveFlow", () => {
  it("lagrer og leser tilbake identisk", () => {
    const s = memoryStorage();
    const f = exampleFlow();
    expect(saveFlow(f, s)).toBe(true);
    expect(loadFlow(s)).toEqual({ status: "ok", flow: f });
  });

  it("faller tilbake på v1 når v2 mangler, og rydder v1 først ved lagring", () => {
    const s = memoryStorage();
    s.setItem(V1_KEY, JSON.stringify(exampleWorkflow()));
    const r = loadFlow(s);
    expect(r.status).toBe("ok");
    expect(r.status === "ok" && r.flow.navn).toBe("Tilbudsforespørsel");
    expect(s.map.has(STORAGE_KEY)).toBe(false);
    expect(s.map.has(V1_KEY)).toBe(true);
    if (r.status === "ok") saveFlow(r.flow, s);
    expect(s.map.has(STORAGE_KEY)).toBe(true);
    expect(s.map.has(V1_KEY)).toBe(false);
  });

  it("gir «empty» uten lagring eller data", () => {
    expect(loadFlow(null)).toEqual({ status: "empty" });
    expect(loadFlow(memoryStorage())).toEqual({ status: "empty" });
  });

  it("tar kopi av uleselig v2 og rører ikke originalen", () => {
    const s = memoryStorage();
    s.setItem(STORAGE_KEY, "{korrupt");
    expect(loadFlow(s).status).toBe("invalid");
    expect(readBackup(s)).toBe("{korrupt");
    expect(s.map.get(STORAGE_KEY)).toBe("{korrupt");
  });

  it("eksport og import gir identisk kart", () => {
    const f = seedFlow();
    const r = parseFlow(serializeFlow(f));
    expect(r.ok && r.flow).toEqual(f);
  });

  it("returnerer false når lagring kaster, og tåler lagring uten removeItem", () => {
    const throwing = { getItem: () => null, setItem: () => { throw new Error("full"); } };
    expect(saveFlow(seedFlow(), throwing)).toBe(false);
    expect(readBackup(throwing)).toBeNull();
    const minimal = { getItem: () => null, setItem: () => undefined };
    expect(saveFlow(seedFlow(), minimal)).toBe(true);
  });
});
