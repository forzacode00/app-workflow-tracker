import { describe, expect, it } from "vitest";
import { MAX_EDGES, type Flow, type FlowEdge, type FlowNode } from "./flow";
import { anchorOf, stitch } from "./flowEdit";

const edge = (from: string, to: string): FlowEdge => ({ id: `${from}-${to}`, from, to });
const node = (id: string, type: FlowNode["type"]): FlowNode => ({ id, type, tittel: id, notat: "", x: 0, y: 0 });
const flow = (nodes: FlowNode[], edges: FlowEdge[]): Flow => ({ versjon: 2, navn: "", nodes, edges, eksempel: false });

describe("stitch", () => {
  it("syr gjennom flere fjernede bokser", () => {
    const out = stitch([edge("a", "b"), edge("b", "c"), edge("c", "d")], new Set(["b", "c"]));
    expect(out.map((e) => `${e.from}>${e.to}`)).toEqual(["a>d"]);
  });
  it("lager ikke duplikater eller selvkoblinger, og klipper ved taket med beholdte kanter først", () => {
    const edges = [edge("a", "g1"), edge("a", "g2"), edge("g1", "b"), edge("g2", "b"), edge("a", "b"), edge("b", "a"), edge("a", "x")];
    expect(stitch(edges, new Set(["g1", "g2"])).map((e) => `${e.from}>${e.to}`).sort()).toEqual(["a>b", "a>x", "b>a"]);
    const many = Array.from({ length: 30 }, (_, i) => edge(`in${i}`, "g")).concat(Array.from({ length: 30 }, (_, i) => edge("g", `out${i}`)));
    const capped = stitch([edge("x", "y"), ...many], new Set(["g"]));
    expect(capped).toHaveLength(MAX_EDGES);
    expect(capped[0]).toMatchObject({ from: "x", to: "y" });
  });
  it("tåler sløyfer blant de fjernede", () => {
    const edges = [edge("a", "g1"), edge("g1", "g2"), edge("g2", "g1"), edge("g2", "b")];
    expect(stitch(edges, new Set(["g1", "g2"])).map((e) => `${e.from}>${e.to}`)).toEqual(["a>b"]);
  });
});

describe("anchorOf", () => {
  it("foretrekker steget som peker inn i bladet", () => {
    const f = flow([node("s1", "steg"), node("s3", "steg"), node("d", "data")], [edge("d", "s1"), edge("s3", "d")]);
    expect(anchorOf(f, f.nodes[2]!)?.id).toBe("s3");
  });
  it("faller tilbake på steget bladet peker på", () => {
    const f = flow([node("s1", "steg"), node("d", "data")], [edge("d", "s1")]);
    expect(anchorOf(f, f.nodes[1]!)?.id).toBe("s1");
  });
  it("resultat, system og spørsmål er blad; start og mål kan være anker", () => {
    const f = flow([node("m", "maal"), node("st", "start"), node("re", "resultat"), node("sy", "system"), node("q", "sporsmal")], [edge("st", "re"), edge("sy", "m"), edge("m", "q")]);
    expect(anchorOf(f, f.nodes[2]!)?.id).toBe("st");
    expect(anchorOf(f, f.nodes[3]!)?.id).toBe("m");
    expect(anchorOf(f, f.nodes[4]!)?.id).toBe("m");
  });
  it("personer og steg er ikke blad", () => {
    const f = flow([node("m", "maal"), node("p", "person"), node("s", "steg")], [edge("m", "p"), edge("m", "s")]);
    expect(anchorOf(f, f.nodes[1]!)).toBeUndefined();
    expect(anchorOf(f, f.nodes[2]!)).toBeUndefined();
  });
});
