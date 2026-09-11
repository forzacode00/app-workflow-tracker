import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MAX_EDGES,
  MAX_NODES,
  newId,
  placeNear,
  seedNode,
  type Flow,
  type FlowNode,
  type NodeType,
  type Position,
} from "@/lib/flow";
import {
  activeModule,
  asFlow,
  canRef,
  MAX_MODULES,
  newModuleId,
  placeModule,
  seedModule,
  seedWorkspace,
  tidyWorkspace,
  type Module,
  type Workspace,
} from "@/lib/workspace";
import { exampleWorkspace } from "@/lib/workspaceExample";
import { loadWorkspace, saveWorkspace, type LoadResult } from "@/lib/workspaceStorage";

export type StorageState = { saveFailed: boolean; loadError: string | null };

export const SAVE_DELAY_MS = 250;

/** Bokser som henger på et steg. Legger man til noe fra en slik boks, festes det nye på steget den henger på. */
const LEAF: readonly NodeType[] = ["regel", "sporsmal", "resultat", "system", "person", "data"];
const ANCHOR: readonly NodeType[] = ["steg", "start", "maal"];

/** Steget en bladboks henger på, hvis noe. */
function anchorOf(flow: Flow, node: FlowNode): FlowNode | undefined {
  if (!LEAF.includes(node.type)) return undefined;
  const ids = flow.edges.filter((e) => e.to === node.id || e.from === node.id).map((e) => (e.to === node.id ? e.from : e.to));
  return flow.nodes.find((n) => ids.includes(n.id) && ANCHOR.includes(n.type));
}

/** Sy kjeden sammen: alle som pekte inn i en fjernet boks, pekes videre til det den pekte på. */
function stitch(m: Module, gone: Set<string>): Module["edges"] {
  const kept = m.edges.filter((e) => !gone.has(e.from) && !gone.has(e.to));
  const extra: Module["edges"] = [];
  for (const id of gone) {
    const ins = m.edges.filter((e) => e.to === id && !gone.has(e.from)).map((e) => e.from);
    const outs = m.edges.filter((e) => e.from === id && !gone.has(e.to)).map((e) => e.to);
    for (const a of ins) for (const b of outs) if (a !== b && !kept.some((e) => e.from === a && e.to === b)) extra.push({ id: newId("e"), from: a, to: b });
  }
  return [...kept, ...extra];
}

export function useWorkspace() {
  const [loaded] = useState<LoadResult>(() => loadWorkspace());
  const [ws, setWs] = useState<Workspace>(() => (loaded.status === "ok" ? loaded.workspace : seedWorkspace()));
  /** Første besøk: målboksen er valgt så panelet er åpent og man kan skrive med en gang. */
  const [selectedId, setSelectedId] = useState<string | null>(() => (loaded.status === "ok" ? null : "maal"));
  const [view, setView] = useState<"modul" | "oversikt">("modul");
  const [generation, setGeneration] = useState(0);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const dirty = useRef(false);
  const previous = useRef<Workspace | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(ws);
  useEffect(() => {
    latest.current = ws;
  }, [ws]);

  useEffect(() => {
    if (!dirty.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      setSaveFailed(!saveWorkspace(ws));
    }, SAVE_DELAY_MS);
  }, [ws]);

  useEffect(
    () => () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveWorkspace(latest.current);
      }
    },
    [],
  );

  const module = useMemo(() => activeModule(ws), [ws]);
  const flow = useMemo(() => asFlow(module), [module]);

  /** Endrer hele arbeidsområdet. */
  const editWs = useCallback((fn: (w: Workspace) => Workspace) => {
    dirty.current = true;
    setWs((w) => tidyWorkspace(fn(w)));
  }, []);

  /** Innholdsendring i den aktive modulen. Nullstiller eksempel-flagget på modulen. */
  const edit = useCallback(
    (fn: (m: Module) => Module) =>
      editWs((w) => ({ ...w, moduler: w.moduler.map((m) => (m.id === w.aktiv ? { ...fn(m), eksempel: false } : m)) })),
    [editWs],
  );

  /** Endring som lagres uten å gjøre eksempelet til «dine data» (flytting). */
  const commit = useCallback(
    (fn: (m: Module) => Module) => editWs((w) => ({ ...w, moduler: w.moduler.map((m) => (m.id === w.aktiv ? fn(m) : m)) })),
    [editWs],
  );

  const snapshot = useCallback(() => {
    previous.current = latest.current;
  }, []);

  const setName = useCallback((navn: string) => edit((m) => ({ ...m, navn })), [edit]);

  const updateNode = useCallback(
    (id: string, patch: Partial<Pick<FlowNode, "tittel" | "notat" | "type" | "ref">>) =>
      edit((m) => ({
        ...m,
        nodes: m.nodes.map((n) => {
          if (n.id !== id) return n;
          const next = { ...n, ...patch };
          if (!canRef(next.type) || !next.ref) delete next.ref;
          return next;
        }),
      })),
    [edit],
  );

  const moveNodes = useCallback(
    (positions: Record<string, Position>) =>
      commit((m) => ({ ...m, nodes: m.nodes.map((n) => (positions[n.id] ? { ...n, ...positions[n.id] } : n)) })),
    [commit],
  );

  const addNode = useCallback(
    (type: NodeType, fromId?: string | null, position?: Position): string | null => {
      const current = activeModule(latest.current);
      if (current.nodes.length >= MAX_NODES) return null;
      const id = newId();
      edit((m) => {
        const f = asFlow(m);
        let from = fromId ? m.nodes.find((n) => n.id === fromId) : undefined;
        /* Fra en regel eller et resultat: fest det nye på steget de henger på, så kjeden ikke går via bladet. */
        if (from && type !== "sporsmal") from = anchorOf(f, from) ?? from;
        const pos = position ?? placeNear(f, from);
        const node: FlowNode = { id, type, tittel: "", notat: "", x: Math.round(pos.x), y: Math.round(pos.y) };
        const edges = from && m.edges.length < MAX_EDGES ? [...m.edges, { id: newId("e"), from: from.id, to: id }] : m.edges;
        return { ...m, nodes: [...m.nodes, node], edges };
      });
      setSelectedId(id);
      setLastAdded(id);
      return id;
    },
    [edit],
  );

  const removeNodes = useCallback(
    (ids: string[]): number => {
      const gone = new Set(ids);
      const count = activeModule(latest.current).nodes.filter((n) => gone.has(n.id)).length;
      if (count === 0) return 0;
      snapshot();
      edit((m) => {
        const nodes = m.nodes.filter((n) => !gone.has(n.id));
        return { ...m, nodes: nodes.length ? nodes : [seedNode()], edges: stitch(m, gone) };
      });
      setSelectedId((s) => (s && gone.has(s) ? null : s));
      return count;
    },
    [edit, snapshot],
  );

  const connect = useCallback(
    (from: string, to: string) => {
      if (activeModule(latest.current).edges.length >= MAX_EDGES) return;
      edit((m) => ({ ...m, edges: [...m.edges, { id: newId("e"), from, to }] }));
    },
    [edit],
  );

  const removeEdges = useCallback(
    (ids: string[]): number => {
      const gone = new Set(ids);
      const count = activeModule(latest.current).edges.filter((e) => gone.has(e.id)).length;
      if (count === 0) return 0;
      snapshot();
      edit((m) => ({ ...m, edges: m.edges.filter((e) => !gone.has(e.id)) }));
      return count;
    },
    [edit, snapshot],
  );

  /* Moduler */

  const switchModule = useCallback(
    (id: string) => {
      editWs((w) => (w.moduler.some((m) => m.id === id) ? { ...w, aktiv: id } : w));
      setSelectedId(null);
      setView("modul");
      setGeneration((g) => g + 1);
    },
    [editWs],
  );

  /** Ny, tom modul. Returnerer id-en, eller null hvis det er fullt. */
  const addModule = useCallback(
    (navn = ""): string | null => {
      if (latest.current.moduler.length >= MAX_MODULES) return null;
      const id = newModuleId();
      editWs((w) => ({ ...w, moduler: [...w.moduler, { ...seedModule(id, navn), ...placeModule(w) }], aktiv: id }));
      setSelectedId("maal");
      setView("modul");
      setGeneration((g) => g + 1);
      return id;
    },
    [editWs],
  );

  /** Legger til en ferdig modul (import). */
  const insertModule = useCallback(
    (m: Module) => {
      if (latest.current.moduler.length >= MAX_MODULES) return false;
      snapshot();
      editWs((w) => ({ ...w, moduler: [...w.moduler, { ...m, ...placeModule(w), eksempel: false }], aktiv: m.id }));
      setSelectedId(null);
      setView("modul");
      setGeneration((g) => g + 1);
      return true;
    },
    [editWs, snapshot],
  );

  /** Fjerner en modul. Siste modul kan ikke fjernes, den tømmes i stedet. Kan angres. */
  const removeModule = useCallback(
    (id: string) => {
      snapshot();
      editWs((w) => {
        const rest = w.moduler.filter((m) => m.id !== id);
        if (rest.length === 0) return seedWorkspace();
        return { ...w, moduler: rest, aktiv: w.aktiv === id ? rest[0]!.id : w.aktiv };
      });
      setSelectedId(null);
      setGeneration((g) => g + 1);
    },
    [editWs, snapshot],
  );

  const moveModules = useCallback(
    (positions: Record<string, Position>) =>
      editWs((w) => ({ ...w, moduler: w.moduler.map((m) => (positions[m.id] ? { ...m, ...positions[m.id] } : m)) })),
    [editWs],
  );

  /* Hele arbeidsområdet */

  const replace = useCallback((next: Workspace) => {
    dirty.current = true;
    setWs((w) => {
      previous.current = w;
      return tidyWorkspace(next);
    });
    setSelectedId(null);
    setView("modul");
    setGeneration((g) => g + 1);
  }, []);

  /** Tømmer den aktive modulen. Kan angres. */
  const reset = useCallback(() => {
    snapshot();
    editWs((w) => ({ ...w, moduler: w.moduler.map((m) => (m.id === w.aktiv ? { ...seedModule(m.id, ""), x: m.x, y: m.y } : m)) }));
    setSelectedId("maal");
    setView("modul");
    setGeneration((g) => g + 1);
  }, [editWs, snapshot]);

  const loadExample = useCallback(() => replace(exampleWorkspace()), [replace]);

  const undo = useCallback((): boolean => {
    const prev = previous.current;
    if (!prev) return false;
    previous.current = null;
    dirty.current = true;
    setWs(prev);
    setSelectedId(null);
    setGeneration((g) => g + 1);
    return true;
  }, []);

  const selected = useMemo(() => module.nodes.find((n) => n.id === selectedId) ?? null, [module.nodes, selectedId]);
  const storage: StorageState = useMemo(
    () => ({ saveFailed, loadError: loaded.status === "invalid" ? loaded.error : null }),
    [saveFailed, loaded],
  );

  return useMemo(
    () => ({
      ws,
      module,
      flow,
      view,
      setView,
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
      switchModule,
      addModule,
      insertModule,
      removeModule,
      moveModules,
      replace,
      reset,
      loadExample,
      undo,
    }),
    [ws, module, flow, view, generation, lastAdded, selected, selectedId, storage, setName, updateNode, moveNodes, addNode, removeNodes, connect, removeEdges, switchModule, addModule, insertModule, removeModule, moveModules, replace, reset, loadExample, undo],
  );
}

export type FlowActions = ReturnType<typeof useWorkspace>;
