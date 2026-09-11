import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MAX_EDGES,
  MAX_NODES,
  newId,
  placeNear,
  seedFlow,
  seedNode,
  tidyEdges,
  type Flow,
  type FlowNode,
  type NodeType,
  type Position,
} from "@/lib/flow";
import { exampleFlow } from "@/lib/flowExample";
import { loadFlow, saveFlow, type LoadResult } from "@/lib/flowStorage";

export type StorageState = { saveFailed: boolean; loadError: string | null };

export const SAVE_DELAY_MS = 250;

export function useFlow() {
  const [loaded] = useState<LoadResult>(() => loadFlow());
  const [flow, setFlow] = useState<Flow>(() => (loaded.status === "ok" ? loaded.flow : seedFlow()));
  /** Første besøk: målboksen er valgt så panelet er åpent og man kan skrive med en gang. */
  const [selectedId, setSelectedId] = useState<string | null>(() => (loaded.status === "ok" ? null : "maal"));
  /** Økes hver gang hele kartet byttes ut, så lerretet kan tilpasse utsnittet på nytt. */
  const [generation, setGeneration] = useState(0);
  /** Sist tillagte boks, så lerretet kan panorere til den. */
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const dirty = useRef(false);
  const previous = useRef<Flow | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Siste kart, til bruk i hendelser (grenser, lagring ved unmount). Oppdateres etter hver render. */
  const latest = useRef(flow);
  useEffect(() => {
    latest.current = flow;
  }, [flow]);

  useEffect(() => {
    if (!dirty.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      setSaveFailed(!saveFlow(flow));
    }, SAVE_DELAY_MS);
  }, [flow]);

  /* Ventende lagring skrives med en gang hvis komponenten forsvinner. */
  useEffect(
    () => () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveFlow(latest.current);
      }
    },
    [],
  );

  /** Innholdsendringer: markerer som endret og nullstiller eksempel-flagget. */
  const edit = useCallback((fn: (f: Flow) => Flow) => {
    dirty.current = true;
    setFlow((f) => ({ ...tidyEdges(fn(f)), eksempel: false }));
  }, []);

  /** Endringer som skal lagres, men som ikke gjør eksempelet til «dine data» (flytting). */
  const commit = useCallback((fn: (f: Flow) => Flow) => {
    dirty.current = true;
    setFlow(fn);
  }, []);

  /** Tar vare på kartet før noe fjernes, så det kan angres. */
  const snapshot = useCallback((f: Flow) => {
    previous.current = f;
  }, []);

  const setName = useCallback((navn: string) => edit((f) => ({ ...f, navn })), [edit]);

  const updateNode = useCallback(
    (id: string, patch: Partial<Pick<FlowNode, "tittel" | "notat" | "type">>) =>
      edit((f) => ({ ...f, nodes: f.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) })),
    [edit],
  );

  /** Flytt bokser etter at draing er avsluttet. */
  const moveNodes = useCallback(
    (positions: Record<string, Position>) =>
      commit((f) => ({ ...f, nodes: f.nodes.map((n) => (positions[n.id] ? { ...n, ...positions[n.id] } : n)) })),
    [commit],
  );

  /**
   * Legger til en boks, valgfritt koblet fra en annen og på en gitt plass.
   * Returnerer id-en og velger den nye boksen, eller null hvis kartet er fullt.
   */
  const addNode = useCallback(
    (type: NodeType, fromId?: string | null, position?: Position): string | null => {
      if (latest.current.nodes.length >= MAX_NODES) return null;
      const id = newId();
      edit((f) => {
        const from = fromId ? f.nodes.find((n) => n.id === fromId) : undefined;
        const pos = position ?? placeNear(f, from);
        const node: FlowNode = { id, type, tittel: "", notat: "", x: Math.round(pos.x), y: Math.round(pos.y) };
        const edges = from && f.edges.length < MAX_EDGES ? [...f.edges, { id: newId("e"), from: from.id, to: id }] : f.edges;
        return { ...f, nodes: [...f.nodes, node], edges };
      });
      setSelectedId(id);
      setLastAdded(id);
      return id;
    },
    [edit],
  );

  /** Fjerner bokser med kantene deres. Kan angres. Blir kartet tomt, settes en ny målboks inn. */
  const removeNodes = useCallback(
    (ids: string[]): number => {
      const gone = new Set(ids);
      const count = latest.current.nodes.filter((n) => gone.has(n.id)).length;
      if (count === 0) return 0;
      edit((f) => {
        snapshot(f);
        const nodes = f.nodes.filter((n) => !gone.has(n.id));
        return {
          ...f,
          nodes: nodes.length ? nodes : [seedNode()],
          edges: f.edges.filter((e) => !gone.has(e.from) && !gone.has(e.to)),
        };
      });
      setSelectedId((s) => (s && gone.has(s) ? null : s));
      return count;
    },
    [edit, snapshot],
  );

  const connect = useCallback(
    (from: string, to: string) => {
      if (latest.current.edges.length >= MAX_EDGES) return;
      edit((f) => ({ ...f, edges: [...f.edges, { id: newId("e"), from, to }] }));
    },
    [edit],
  );

  const removeEdges = useCallback(
    (ids: string[]): number => {
      const gone = new Set(ids);
      const count = latest.current.edges.filter((e) => gone.has(e.id)).length;
      if (count === 0) return 0;
      edit((f) => {
        snapshot(f);
        return { ...f, edges: f.edges.filter((e) => !gone.has(e.id)) };
      });
      return count;
    },
    [edit, snapshot],
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
      lastAdded,
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
    [flow, generation, lastAdded, selected, selectedId, storage, setName, updateNode, moveNodes, addNode, removeNodes, connect, removeEdges, replace, reset, loadExample, undo],
  );
}

export type FlowActions = ReturnType<typeof useFlow>;
