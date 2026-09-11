import type { Position } from "./flow";

/** Det vi trenger fra React Flows `NodeChange`. Holdt smalt så logikken kan testes uten React Flow. */
export type NodeChangeLike =
  | { type: "position"; id: string; position?: Position; dragging?: boolean }
  | { type: "remove"; id: string }
  | { type: "select"; id: string; selected: boolean }
  | { type: "add" | "replace" | "dimensions"; id?: string };

export type EdgeChangeLike = { type: "remove"; id: string } | { type: "add" | "replace" | "select"; id?: string };

export type NodeChangeSummary = {
  /** Endelige posisjoner, avrundet til hele piksler. Bare fra endringer der draing er avsluttet. */
  moved: Record<string, Position>;
  removed: string[];
  /** `undefined` = ingen valg-endring, `null` = alt avvalgt. */
  selected: string | null | undefined;
};

/** Slår sammen en liste React Flow-endringer til det kartet trenger å vite. */
export function summarizeNodeChanges(changes: readonly NodeChangeLike[]): NodeChangeSummary {
  const moved: Record<string, Position> = {};
  const removed: string[] = [];
  let selected: string | null | undefined;
  for (const c of changes) {
    if (c.type === "position" && c.position && c.dragging === false) {
      moved[c.id] = { x: Math.round(c.position.x), y: Math.round(c.position.y) };
    } else if (c.type === "remove") {
      removed.push(c.id);
    } else if (c.type === "select") {
      if (c.selected) selected = c.id;
      else if (selected === undefined || selected === c.id) selected = null;
    }
  }
  return { moved, removed, selected };
}

export const removedEdgeIds = (changes: readonly EdgeChangeLike[]): string[] =>
  changes.filter((c): c is { type: "remove"; id: string } => c.type === "remove").map((c) => c.id);
