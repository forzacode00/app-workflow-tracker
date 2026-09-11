import { describe, expect, it } from "vitest";
import { removedEdgeIds, summarizeNodeChanges } from "./canvasChanges";

describe("summarizeNodeChanges", () => {
  it("tar bare med posisjoner der draingen er ferdig, avrundet", () => {
    const s = summarizeNodeChanges([
      { type: "position", id: "a", position: { x: 10.4, y: 20.6 }, dragging: true },
      { type: "position", id: "b", position: { x: 10.4, y: 20.6 }, dragging: false },
      { type: "position", id: "c", dragging: false },
    ]);
    expect(s.moved).toEqual({ b: { x: 10, y: 21 } });
  });

  it("samler fjernede bokser", () => {
    expect(summarizeNodeChanges([{ type: "remove", id: "a" }, { type: "remove", id: "b" }]).removed).toEqual(["a", "b"]);
  });

  it("skiller mellom ingen valg-endring, avvalg og nytt valg", () => {
    expect(summarizeNodeChanges([{ type: "dimensions", id: "a" }]).selected).toBeUndefined();
    expect(summarizeNodeChanges([{ type: "select", id: "a", selected: false }]).selected).toBeNull();
    expect(summarizeNodeChanges([{ type: "select", id: "a", selected: false }, { type: "select", id: "b", selected: true }]).selected).toBe("b");
    expect(summarizeNodeChanges([{ type: "select", id: "b", selected: true }, { type: "select", id: "a", selected: false }]).selected).toBe("b");
  });
});

describe("removedEdgeIds", () => {
  it("plukker ut fjernede kanter", () => {
    expect(removedEdgeIds([{ type: "select", id: "x" }, { type: "remove", id: "e1" }])).toEqual(["e1"]);
  });
});
