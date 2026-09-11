import { describe, expect, it } from "vitest";
import { exampleFlow } from "./flowExample";
import { validateFlow } from "./flowStorage";

describe("validateFlow", () => {
  it("leser et kart og rydder kanter", () => {
    const f = exampleFlow();
    f.edges.push({ id: "løs", from: "maal", to: "finnes-ikke" });
    const r = validateFlow(f);
    expect(r.ok && r.flow.edges.some((e) => e.id === "løs")).toBe(false);
    expect(r.ok && r.flow.nodes.length).toBe(f.nodes.length);
  });

  it("avviser ukjent bokstype med sti", () => {
    const r = validateFlow({ versjon: 2, nodes: [{ id: "a", type: "ukjent", tittel: "", notat: "", x: 0, y: 0 }] });
    expect(!r.ok && r.error).toContain("nodes.0.type");
  });

  it("avviser duplikate id-er med skjemaets egen melding", () => {
    const n = { type: "steg", tittel: "", notat: "", x: 0, y: 0 };
    const r = validateFlow({ versjon: 2, nodes: [{ ...n, id: "a" }, { ...n, id: "a" }] });
    expect(!r.ok && r.error).toBe("«nodes.1.id»: Samme id brukes to ganger. Be kollegaen eksportere på nytt.");
  });

  it("fyller inn manglende toppnivåfelt", () => {
    const r = validateFlow({ versjon: 2 });
    expect(r.ok && r.flow).toEqual({ versjon: 2, navn: "", nodes: [], edges: [], eksempel: false });
  });
});
