import { describe, expect, it } from "vitest";
import {
  emptyFlow,
  flowSchema,
  isBlank,
  MAX_COORD,
  neighbours,
  newId,
  OFFSET_X,
  OFFSET_Y,
  orderedSteps,
  placeNear,
  tidyEdges,
  type Flow,
  type FlowNode,
} from "./flow";

const node = (id: string, type: FlowNode["type"], y = 0, x = 0): FlowNode => ({ id, type, tittel: id, notat: "", x, y });
const flowWith = (nodes: FlowNode[], edges: [string, string][]): Flow => ({
  ...emptyFlow(),
  nodes,
  edges: edges.map(([from, to]) => ({ id: `${from}-${to}`, from, to })),
});

describe("newId", () => {
  it("gir unike id-er i samme millisekund", () => {
    const ids = new Set(Array.from({ length: 50 }, () => newId()));
    expect(ids.size).toBe(50);
  });
});

describe("flowSchema", () => {
  it("avviser duplikate id-er på bokser og kanter, med sti til raden", () => {
    const dupNodes = flowSchema.safeParse({ ...emptyFlow(), nodes: [node("a", "steg"), node("a", "steg")] });
    expect(dupNodes.success).toBe(false);
    expect(!dupNodes.success && dupNodes.error.issues[0]?.path).toEqual(["nodes", 1, "id"]);
    const dupEdges = flowSchema.safeParse({
      ...emptyFlow(),
      nodes: [node("a", "steg"), node("b", "steg")],
      edges: [{ id: "e", from: "a", to: "b" }, { id: "e", from: "b", to: "a" }],
    });
    expect(dupEdges.success).toBe(false);
  });

  it("avviser koordinater utenfor lerretet", () => {
    expect(flowSchema.safeParse({ ...emptyFlow(), nodes: [{ ...node("a", "steg"), x: MAX_COORD + 1 }] }).success).toBe(false);
    expect(flowSchema.safeParse({ ...emptyFlow(), nodes: [{ ...node("a", "steg"), y: -MAX_COORD }] }).success).toBe(true);
  });
});

const seedFlow = (): Flow => ({ ...emptyFlow(), nodes: [{ id: "maal", type: "maal", tittel: "", notat: "", x: 0, y: 0 }] });

describe("isBlank", () => {
  it("startkartet regnes som tomt", () => {
    expect(isBlank(seedFlow())).toBe(true);
  });
  it("én tittel gjør kartet ikke-tomt", () => {
    const f = seedFlow();
    f.nodes[0]!.tittel = "x";
    expect(isBlank(f)).toBe(false);
  });
});

describe("tidyEdges", () => {
  it("fjerner kanter til bokser som ikke finnes, selvkoblinger og duplikater", () => {
    const f = flowWith([node("a", "steg"), node("b", "steg")], [["a", "b"], ["a", "b"], ["a", "a"], ["a", "x"]]);
    expect(tidyEdges(f).edges.map((e) => `${e.from}>${e.to}`)).toEqual(["a>b"]);
  });
  it("fjerner kanter med samme id", () => {
    const f: Flow = { ...emptyFlow(), nodes: [node("a", "steg"), node("b", "steg")], edges: [{ id: "e", from: "a", to: "b" }, { id: "e", from: "b", to: "a" }] };
    expect(tidyEdges(f).edges).toHaveLength(1);
  });
  it("returnerer samme objekt når ingenting må ryddes", () => {
    const f = flowWith([node("a", "steg"), node("b", "steg")], [["a", "b"]]);
    expect(tidyEdges(f)).toBe(f);
  });
});

describe("neighbours", () => {
  const f = flowWith([node("a", "steg"), node("b", "regel"), node("c", "data")], [["a", "b"], ["c", "a"]]);
  it("naboer er uansett retning", () => {
    expect(neighbours(f, "a").map((n) => n.id)).toEqual(["b", "c"]);
  });
});

describe("placeNear", () => {
  it("uten utgangspunkt: under nederste boks, eller origo på tomt kart", () => {
    expect(placeNear(emptyFlow(), undefined)).toEqual({ x: 0, y: 0 });
    expect(placeNear(flowWith([node("a", "steg", 50)], []), undefined)).toEqual({ x: 0, y: 50 + OFFSET_Y });
  });
  it("til høyre for utgangspunktet, og under søsken som allerede ligger der", () => {
    const a = node("a", "maal", 0, 0);
    const f = flowWith([a, node("b", "steg", 0, OFFSET_X), node("c", "steg", -500, OFFSET_X)], [["a", "b"], ["a", "c"]]);
    expect(placeNear(f, a)).toEqual({ x: OFFSET_X, y: OFFSET_Y });
  });
  it("teller ikke naboer som ligger til venstre", () => {
    const a = node("a", "maal", 0, 0);
    const f = flowWith([a, node("p", "person", 0, -300)], [["a", "p"]]);
    expect(placeNear(f, a)).toEqual({ x: OFFSET_X, y: 0 });
  });
});

describe("orderedSteps", () => {
  it("følger pilene fra første steg", () => {
    const f = flowWith([node("s3", "steg", 0), node("s1", "steg", 100), node("s2", "steg", 200)], [["s1", "s2"], ["s2", "s3"]]);
    expect(orderedSteps(f).map((n) => n.id)).toEqual(["s1", "s2", "s3"]);
  });
  it("faller tilbake på plassering ovenfra og ned uten piler", () => {
    const f = flowWith([node("b", "steg", 100), node("a", "steg", 0), node("c", "steg", 50, 400)], []);
    expect(orderedSteps(f).map((n) => n.id)).toEqual(["a", "c", "b"]);
  });
  it("tar med steg som ligger i en sløyfe", () => {
    const f = flowWith([node("a", "steg", 0), node("b", "steg", 100)], [["a", "b"], ["b", "a"]]);
    expect(orderedSteps(f).map((n) => n.id)).toEqual(["a", "b"]);
  });
  it("ignorerer piler til bokser som ikke er steg", () => {
    const f = flowWith([node("a", "steg", 0), node("r", "regel", 0), node("b", "steg", 100)], [["a", "r"], ["r", "b"]]);
    expect(orderedSteps(f).map((n) => n.id)).toEqual(["a", "b"]);
  });
});
