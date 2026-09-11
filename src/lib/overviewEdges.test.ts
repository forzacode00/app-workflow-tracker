import { describe, expect, it } from "vitest";
import type { FlowNode } from "./flow";
import { overviewEdges } from "./overviewEdges";
import { seedModule, type Workspace } from "./workspace";
import { exampleWorkspace } from "./workspaceExample";

const node = (id: string, type: FlowNode["type"], tittel: string, ref: string): FlowNode => ({ id, type, tittel, notat: "", x: 0, y: 0, ref });

describe("overviewEdges", () => {
  it("snur retningen for start (mottar) og beholder den for resultat (sender)", () => {
    const a = seedModule("a", "A");
    const b = seedModule("b", "B");
    a.nodes.push(node("st", "start", "Fra B", "b"));
    b.nodes.push(node("re", "resultat", "Til A", "a"));
    const ws: Workspace = { versjon: 3, moduler: [a, b], aktiv: "a" };
    const edges = overviewEdges(ws);
    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({ source: "b", target: "a", label: "Fra B · Til A", known: true, offset: 0 });
  });

  it("slår sammen mer enn to etiketter til «+N», og bruker modulnavn når tittelen er tom", () => {
    const a = seedModule("a", "A");
    const b = seedModule("b", "B");
    a.nodes.push(node("r1", "resultat", "En", "b"), node("r2", "resultat", "To", "b"), node("r3", "resultat", "Tre", "b"), node("r4", "resultat", "", "b"));
    const ws: Workspace = { versjon: 3, moduler: [a, b], aktiv: "a" };
    expect(overviewEdges(ws)[0]?.label).toBe("En · To +2");
    a.nodes = [node("r4", "resultat", "", "b")];
    expect(overviewEdges(ws)[0]?.label).toBe("B");
  });

  it("ukjent retning er ikke kjent, men blir kjent hvis en annen boks samme vei har retning", () => {
    const a = seedModule("a", "A");
    const b = seedModule("b", "B");
    a.nodes.push(node("sys", "system", "Løs", "b"));
    const ws: Workspace = { versjon: 3, moduler: [a, b], aktiv: "a" };
    expect(overviewEdges(ws)[0]).toMatchObject({ source: "a", target: "b", known: false });
    a.nodes.push(node("re", "resultat", "Til B", "b"));
    expect(overviewEdges(ws)).toHaveLength(1);
    expect(overviewEdges(ws)[0]).toMatchObject({ known: true, label: "Løs · Til B" });
  });

  it("«begge» gir én pil hver vei med hver sin forskyvning, festet i sidene som vender mot hverandre", () => {
    const edges = overviewEdges(exampleWorkspace());
    expect(edges.map((e) => e.id).sort()).toEqual(["eks-oppfolging>eks-tilbud", "eks-tilbud>eks-oppfolging"]);
    const fram = edges.find((e) => e.source === "eks-tilbud")!;
    const tilbake = edges.find((e) => e.source === "eks-oppfolging")!;
    expect(fram).toMatchObject({ offset: -18, sourceSide: "hoyre", targetSide: "venstre" });
    expect(tilbake).toMatchObject({ offset: 18, sourceSide: "venstre", targetSide: "hoyre" });
    const a = seedModule("a", "A");
    const b = seedModule("b", "B");
    a.nodes.push(node("start", "start", "x", "b"));
    b.nodes.push(node("start", "start", "y", "a"));
    const ws: Workspace = { versjon: 3, moduler: [a, b], aktiv: "a" };
    expect(new Set(overviewEdges(ws).map((e) => e.id)).size).toBe(2);
  });
});
