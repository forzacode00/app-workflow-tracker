import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isBlank, MAX_EDGES, MAX_NODES, newId, placeNear, seedNode, type FlowNode, type NodeType, type Position } from "@/lib/flow";
import { anchorOf, stitch } from "@/lib/flowEdit";
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

type EditOptions = { undoable?: boolean };

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

  /**
   * Endrer hele nettstedet. Med `undoable` tas kopi av tilstanden rett før endringen,
   * inne i oppdateringen, så den alltid er den faktiske forrige tilstanden.
   */
  const editWs = useCallback((fn: (w: Workspace) => Workspace, opts: EditOptions = {}) => {
    dirty.current = true;
    setWs((w) => {
      const next = tidyWorkspace(fn(w));
      if (opts.undoable && next !== w) previous.current = w;
      return next;
    });
  }, []);

  /** Innholdsendring i den aktive modulen. Nullstiller eksempel-flagget på modulen. */
  const edit = useCallback(
    (fn: (m: Module) => Module, opts: EditOptions = {}) =>
      editWs((w) => {
        const cur = activeModule(w);
        const next = fn(cur);
        if (next === cur) return w;
        return { ...w, moduler: w.moduler.map((m) => (m.id === cur.id ? { ...next, eksempel: false } : m)) };
      }, opts),
    [editWs],
  );

  /** Endring som lagres uten å gjøre eksempelet til «dine data» (flytting). */
  const commit = useCallback(
    (fn: (m: Module) => Module) =>
      editWs((w) => {
        const cur = activeModule(w);
        const next = fn(cur);
        return next === cur ? w : { ...w, moduler: w.moduler.map((m) => (m.id === cur.id ? next : m)) };
      }),
    [editWs],
  );

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

  /** Legger til en boks. Returnerer id-en, eller null hvis modulen er full. */
  const addNode = useCallback(
    (type: NodeType, fromId?: string | null, position?: Position): string | null => {
      if (activeModule(latest.current).nodes.length >= MAX_NODES) return null;
      const id = newId();
      edit((m) => {
        if (m.nodes.length >= MAX_NODES) return m;
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

  /** Fjerner bokser og syr kjeden sammen. Kan angres. Blir modulen tom, settes en ny målboks inn. */
  const removeNodes = useCallback(
    (ids: string[]): number => {
      const gone = new Set(ids);
      const count = activeModule(latest.current).nodes.filter((n) => gone.has(n.id)).length;
      if (count === 0) return 0;
      edit(
        (m) => {
          const nodes = m.nodes.filter((n) => !gone.has(n.id));
          if (nodes.length === m.nodes.length) return m;
          return { ...m, nodes: nodes.length ? nodes : [seedNode()], edges: stitch(m.edges, gone) };
        },
        { undoable: true },
      );
      setSelectedId((s) => (s && gone.has(s) ? null : s));
      return count;
    },
    [edit],
  );

  const connect = useCallback(
    (from: string, to: string) => edit((m) => (m.edges.length >= MAX_EDGES ? m : { ...m, edges: [...m.edges, { id: newId("e"), from, to }] })),
    [edit],
  );

  const removeEdges = useCallback(
    (ids: string[]): number => {
      const gone = new Set(ids);
      const count = activeModule(latest.current).edges.filter((e) => gone.has(e.id)).length;
      if (count === 0) return 0;
      edit((m) => (m.edges.some((e) => gone.has(e.id)) ? { ...m, edges: m.edges.filter((e) => !gone.has(e.id)) } : m), { undoable: true });
      return count;
    },
    [edit],
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

  /** Ny, tom modul. Returnerer id-en, eller null hvis det er fullt. Med `stay` blir du i modulen du er i. */
  const addModule = useCallback(
    (navn = "", opts: { stay?: boolean } = {}): string | null => {
      if (latest.current.moduler.length >= MAX_MODULES) return null;
      const id = newModuleId();
      editWs((w) =>
        w.moduler.length >= MAX_MODULES ? w : { ...w, moduler: [...w.moduler, { ...seedModule(id, navn), ...placeModule(w) }], aktiv: opts.stay ? w.aktiv : id },
      );
      if (!opts.stay) {
        setSelectedId("maal");
        setView("modul");
        setGeneration((g) => g + 1);
      }
      return id;
    },
    [editWs],
  );

  /** Legger til en ferdig modul (import). Kolliderer id-en, får den ny. Kan angres. */
  const insertModule = useCallback(
    (m: Module): boolean => {
      if (latest.current.moduler.length >= MAX_MODULES) return false;
      editWs(
        (w) => {
          if (w.moduler.length >= MAX_MODULES) return w;
          const id = w.moduler.some((x) => x.id === m.id) ? newModuleId() : m.id;
          return { ...w, moduler: [...w.moduler, { ...m, id, ...placeModule(w), eksempel: false }], aktiv: id };
        },
        { undoable: true },
      );
      setSelectedId(null);
      setView("modul");
      setGeneration((g) => g + 1);
      return true;
    },
    [editWs],
  );

  /** Fjerner en modul. Siste modul kan ikke fjernes, nettstedet tømmes i stedet. Kan angres. */
  const removeModule = useCallback(
    (id: string) => {
      editWs(
        (w) => {
          const rest = w.moduler.filter((m) => m.id !== id);
          if (rest.length === w.moduler.length) return w;
          if (rest.length === 0) return seedWorkspace();
          return { ...w, moduler: rest, aktiv: w.aktiv === id ? rest[0]!.id : w.aktiv };
        },
        { undoable: true },
      );
      setSelectedId(null);
      setGeneration((g) => g + 1);
    },
    [editWs],
  );

  const moveModules = useCallback(
    (positions: Record<string, Position>) =>
      editWs((w) => ({ ...w, moduler: w.moduler.map((m) => (positions[m.id] ? { ...m, ...positions[m.id] } : m)) })),
    [editWs],
  );

  /* Hele nettstedet */

  /** Erstatter hele nettstedet (import, eksempel). Kan angres. */
  const replace = useCallback(
    (next: Workspace) => {
      editWs(() => next, { undoable: true });
      setSelectedId(null);
      setView("modul");
      setGeneration((g) => g + 1);
    },
    [editWs],
  );

  /** Tømmer den aktive modulen. Er hele nettstedet et eksempel, tømmes alt. Kan angres. */
  const reset = useCallback(() => {
    editWs(
      (w) => {
        if (w.moduler.every((m) => m.eksempel)) return seedWorkspace();
        const cur = activeModule(w);
        if (isBlank(asFlow(cur))) return w;
        return { ...w, moduler: w.moduler.map((m) => (m.id === cur.id ? { ...seedModule(m.id, ""), x: m.x, y: m.y } : m)) };
      },
      { undoable: true },
    );
    setSelectedId("maal");
    setView("modul");
    setGeneration((g) => g + 1);
  }, [editWs]);

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
