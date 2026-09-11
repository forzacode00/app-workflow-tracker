import { describe, expect, it } from "vitest";
import type { FlowNode } from "./flow";
import {
  activeModule,
  asFlow,
  canRef,
  interfaces,
  moduleName,
  moduleSummary,
  placeModule,
  seedModule,
  seedWorkspace,
  tidyWorkspace,
  workspaceFromFlow,
  workspaceSchema,
  type Workspace,
} from "./workspace";
import { exampleWorkspace } from "./workspaceExample";
import { exampleFlow } from "./flowExample";

const node = (id: string, type: FlowNode["type"], tittel = id, ref?: string): FlowNode => ({ id, type, tittel, notat: "", x: 0, y: 0, ...(ref ? { ref } : {}) });

describe("workspaceSchema", () => {
  it("godtar eksempelet og startområdet", () => {
    expect(workspaceSchema.safeParse(exampleWorkspace()).success).toBe(true);
    expect(workspaceSchema.safeParse(seedWorkspace()).success).toBe(true);
  });
  it("avviser duplikate modul-id-er og aktiv som ikke finnes", () => {
    const ws = seedWorkspace();
    expect(workspaceSchema.safeParse({ ...ws, moduler: [ws.moduler[0], ws.moduler[0]] }).success).toBe(false);
    expect(workspaceSchema.safeParse({ ...ws, aktiv: "nei" }).success).toBe(false);
  });
  it("fyller inn eksempel og plass i oversikten", () => {
    const r = workspaceSchema.safeParse({ versjon: 3, aktiv: "a", moduler: [{ id: "a", navn: "", nodes: [], edges: [] }] });
    expect(r.success && r.data.moduler[0]).toEqual({ id: "a", navn: "", nodes: [], edges: [], eksempel: false, x: 0, y: 0 });
  });
});

describe("hjelpere", () => {
  it("workspaceFromFlow og asFlow er hverandres motsats", () => {
    const f = exampleFlow();
    const ws = workspaceFromFlow(f, "x");
    expect(ws.aktiv).toBe("x");
    expect(asFlow(activeModule(ws))).toEqual(f);
  });
  it("moduleName faller tilbake på målboksen, så «(uten navn)»", () => {
    expect(moduleName(seedModule("a", "Navn"))).toBe("Navn");
    const m = seedModule("a");
    m.nodes[0]!.tittel = "Målet";
    expect(moduleName(m)).toBe("Målet");
    expect(moduleName(seedModule("a"))).toBe("(uten navn)");
  });
  it("placeModule legger fire på rad, så ny rad", () => {
    const ws = seedWorkspace();
    expect(placeModule(ws)).toEqual({ x: 560, y: 0 });
    ws.moduler = [ws.moduler[0]!, seedModule("b"), seedModule("c"), seedModule("d")];
    expect(placeModule(ws)).toEqual({ x: 0, y: 240 });
  });
  it("canRef bare for start, resultat og system", () => {
    expect(canRef("start") && canRef("resultat") && canRef("system")).toBe(true);
    expect(canRef("steg") || canRef("maal") || canRef("regel")).toBe(false);
  });
  it("moduleSummary teller og lister", () => {
    expect(moduleName(undefined)).toBe("(ukjent modul)");
    const s = moduleSummary(exampleWorkspace().moduler[0]!);
    expect(s.navn).toBe("Tilbudsforespørsel");
    expect(s.start).toHaveLength(1);
    expect(s.resultater).toHaveLength(2);
    expect(s.bokser).toBe(17);
  });
});

describe("tidyWorkspace", () => {
  it("fjerner referanser til ukjent modul, seg selv og fra typer som ikke kan peke, og retter aktiv", () => {
    const m = seedModule("a");
    m.nodes = [node("s", "system", "S", "finnes-ikke"), node("t", "start", "T", "a"), node("u", "resultat", "U", "b")];
    m.nodes.push({ ...node("r", "regel", "R"), ref: "b" });
    const ws: Workspace = { versjon: 3, moduler: [m, seedModule("b")], aktiv: "zzz" };
    const tidy = tidyWorkspace(ws);
    expect(tidy.aktiv).toBe("a");
    expect(tidy.moduler[0]!.nodes.map((n) => n.ref)).toEqual([undefined, undefined, "b", undefined]);
    expect("ref" in tidy.moduler[0]!.nodes[3]!).toBe(false);
  });
  it("returnerer samme objekt når ingenting må ryddes", () => {
    const ws = exampleWorkspace();
    expect(tidyWorkspace(ws)).toBe(ws);
  });
});

describe("interfaces", () => {
  it("finner alle koblinger i eksempelet med riktig retning", () => {
    const all = interfaces(exampleWorkspace());
    const byNode = Object.fromEntries(all.map((i) => [i.node.id, i]));
    expect(byNode["o2"]).toMatchObject({ fra: "eks-tilbud", til: "eks-oppfolging", retning: "sender" });
    expect(byNode["start"]).toMatchObject({ fra: "eks-oppfolging", til: "eks-tilbud", retning: "mottar" });
    expect(byNode["sys"]).toMatchObject({ retning: "begge" });
    expect(byNode["o1"]).toMatchObject({ retning: "sender" });
  });
  it("system: «ukjent» uten piler, «sender» med pil inn, «mottar» med pil ut", () => {
    const m = seedModule("a");
    m.nodes.push(node("s", "system", "S", "b"), node("t", "steg", "T"));
    const ws: Workspace = { versjon: 3, moduler: [m, seedModule("b")], aktiv: "a" };
    expect(interfaces(ws)[0]?.retning).toBe("ukjent");
    m.edges = [{ id: "e1", from: "t", to: "s" }];
    expect(interfaces(ws)[0]?.retning).toBe("sender");
    m.edges = [{ id: "e1", from: "s", to: "t" }];
    expect(interfaces(ws)[0]?.retning).toBe("mottar");
  });
});
