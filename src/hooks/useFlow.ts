import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { emptyFlow, neighbours, newId, seedFlow, tidyEdges, type Flow, type FlowNode, type NodeType } from "@/lib/flow";
import { exampleFlow } from "@/lib/flowExample";
import { loadFlow, saveFlow, type LoadResult } from "@/lib/flowStorage";

export type StorageState = { saveFailed: boolean; loadError: string | null };

const SAVE_DELAY_MS = 250;
/** Avstand fra en boks til en ny boks som legges til fra den. */
const OFFSET_X = 300;
const OFFSET_Y = 120;

function initial(result: LoadResult): Flow {
  return result.status === "ok" ? result.flow : exampleFlow();
}

/** Finn en ledig plass til høyre for `from`, under bokser som allerede ligger der. */
function placeNear(flow: Flow, from: FlowNode | undefined): { x: number; y: number } {
  if (!from) {
    const maxY = flow.nodes.reduce((m, n) => Math.max(m, n.y), -OFFSET_Y);
    return { x: 0, y: maxY + OFFSET_Y };
  }
  const siblings = neighbours(flow, from.id).filter((n) => n.x >= from.x + OFFSET_X - 1);
  const y = siblings.length ? Math.max(...siblings.map((n) => n.y)) + OFFSET_Y : from.y;
  return { x: from.x + OFFSET_X, y };
}

export function useFlow() {
  const [loaded] = useState<LoadResult>(() => loadFlow());
  const [flow, setFlow] = useState<Flow>(() => initial(loaded));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** Økes hver gang hele kartet byttes ut, så lerretet kan tilpasse utsnittet på nytt. */
  const [generation, setGeneration] = useState(0);
  const [saveFailed, setSaveFailed] = useState(false);
  const dirty = useRef(false);
  const previous = useRef<Flow | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!dirty.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaveFailed(!saveFlow(flow)), SAVE_DELAY_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [flow]);

  /** Alle redigeringer går her: markerer som endret og nullstiller eksempel-flagget. */
  const edit = useCallback((fn: (f: Flow) => Flow) => {
    dirty.current = true;
    setFlow((f) => ({ ...tidyEdges(fn(f)), eksempel: false }));
  }, []);

  const setName = useCallback((navn: string) => edit((f) => ({ ...f, navn })), [edit]);

  const updateNode = useCallback(
    (id: string, patch: Partial<Pick<FlowNode, "tittel" | "notat" | "type">>) =>
      edit((f) => ({ ...f, nodes: f.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) })),
    [edit],
  );

  /** Flytt flere bokser på én gang (fra lerretet under dra). */
  const moveNodes = useCallback(
    (positions: Record<string, { x: number; y: number }>) =>
      edit((f) => ({ ...f, nodes: f.nodes.map((n) => (positions[n.id] ? { ...n, ...positions[n.id] } : n)) })),
    [edit],
  );

  /** Legger til en boks, valgfritt koblet fra en annen. Returnerer id-en, og velger den nye boksen. */
  const addNode = useCallback(
    (type: NodeType, fromId?: string | null): string => {
      const id = newId();
      edit((f) => {
        const from = fromId ? f.nodes.find((n) => n.id === fromId) : undefined;
        const pos = placeNear(f, from);
        const node: FlowNode = { id, type, tittel: "", notat: "", ...pos };
        const edges = from ? [...f.edges, { id: newId("e"), from: from.id, to: id }] : f.edges;
        return { ...f, nodes: [...f.nodes, node], edges };
      });
      setSelectedId(id);
      return id;
    },
    [edit],
  );

  const removeNodes = useCallback(
    (ids: string[]) => {
      const gone = new Set(ids);
      edit((f) => ({ ...f, nodes: f.nodes.filter((n) => !gone.has(n.id)), edges: f.edges.filter((e) => !gone.has(e.from) && !gone.has(e.to)) }));
      setSelectedId((s) => (s && gone.has(s) ? null : s));
    },
    [edit],
  );

  const connect = useCallback(
    (from: string, to: string) => edit((f) => ({ ...f, edges: [...f.edges, { id: newId("e"), from, to }] })),
    [edit],
  );

  const removeEdges = useCallback(
    (ids: string[]) => {
      const gone = new Set(ids);
      edit((f) => ({ ...f, edges: f.edges.filter((e) => !gone.has(e.id)) }));
    },
    [edit],
  );

  /** Erstatter hele kartet (import, tøm, eksempel). Kan angres. */
  const replace = useCallback((next: Flow, keepExampleFlag = false) => {
    dirty.current = true;
    setFlow((f) => {
      previous.current = f;
      return keepExampleFlag ? next : { ...next, eksempel: false };
    });
    setSelectedId(null);
    setGeneration((g) => g + 1);
  }, []);

  const reset = useCallback(() => {
    replace(seedFlow());
    setSelectedId("maal");
  }, [replace]);
  const loadExample = useCallback(() => replace(exampleFlow(), true), [replace]);

  const undo = useCallback((): boolean => {
    const prev = previous.current;
    if (!prev) return false;
    previous.current = null;
    dirty.current = true;
    setFlow(prev);
    setSelectedId(null);
    setGeneration((g) => g + 1);
    return true;
  }, []);

  const selected = useMemo(() => flow.nodes.find((n) => n.id === selectedId) ?? null, [flow.nodes, selectedId]);
  const storage: StorageState = useMemo(
    () => ({ saveFailed, loadError: loaded.status === "invalid" ? loaded.error : null }),
    [saveFailed, loaded],
  );

  return useMemo(
    () => ({
      flow,
      generation,
      selected,
      selectedId,
      storage,
      select: setSelectedId,
      setName,
      updateNode,
      moveNodes,
      addNode,
      removeNodes,
      connect,
      removeEdges,
      replace,
      reset,
      loadExample,
      undo,
    }),
    [flow, generation, selected, selectedId, storage, setName, updateNode, moveNodes, addNode, removeNodes, connect, removeEdges, replace, reset, loadExample, undo],
  );
}

export type FlowActions = ReturnType<typeof useFlow>;

export { emptyFlow };
