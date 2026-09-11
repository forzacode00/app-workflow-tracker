import { applyNodeChanges, Background, BackgroundVariant, Controls, MarkerType, ReactFlow, type Edge, type NodeChange } from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FlowActions } from "@/hooks/useWorkspace";
import { summarizeNodeChanges } from "@/lib/canvasChanges";
import { interfaces, moduleName, moduleSummary, type Workspace } from "@/lib/workspace";
import { moduleQuestionCount } from "@/lib/workspaceBrief";
import { ModuleCard, type ModuleNode } from "./ModuleCard";

const NODE_TYPES = { modul: ModuleCard };

/** Flere piler enn dette gjør oversikten uleselig og treg. Resten står i briefen for hele nettstedet. */
const MAX_OVERVIEW_EDGES = 200;

const ARIA = {
  "node.a11yDescription.default": "Trykk Enter for å velge modulen. Piltaster flytter den. Tab videre til «Åpne» for å gå inn.",
  "controls.zoomIn.ariaLabel": "Zoom inn",
  "controls.zoomOut.ariaLabel": "Zoom ut",
  "controls.fitView.ariaLabel": "Vis hele nettstedet",
};

type Props = {
  actions: Pick<FlowActions, "ws" | "generation" | "moveModules" | "switchModule">;
  onRemoveModule: (id: string) => void;
  /** Kalles når det er flere grensesnitt enn oversikten viser. */
  onTruncated?: (hidden: number) => void;
};

const toNodes = (ws: Workspace, onOpen: (id: string) => void, onRemove: (id: string) => void): ModuleNode[] =>
  ws.moduler.map((m) => {
    const s = moduleSummary(m);
    return {
      id: m.id,
      type: "modul",
      position: { x: m.x, y: m.y },
      data: { navn: s.navn, maal: s.maal, bokser: s.bokser, sporsmal: moduleQuestionCount(m), aktiv: m.id === ws.aktiv, eksempel: m.eksempel, onOpen, onRemove },
    };
  });

/**
 * Kanter for oversikten. Retningen er dataenes. Flere grensesnitt samme vei mellom to moduler
 * slås sammen til én pil med flere etiketter, så de ikke ligger oppå hverandre. «Ukjent» retning
 * tegnes stiplet uten pilhode.
 */
function overviewEdges(ws: Workspace): Edge[] {
  const groups = new Map<string, { source: string; target: string; labels: string[]; known: boolean }>();
  const add = (source: string, target: string, label: string, known: boolean) => {
    const key = `${source}>${target}`;
    const g = groups.get(key) ?? { source, target, labels: [], known: false };
    g.labels.push(label);
    g.known = g.known || known;
    groups.set(key, g);
  };
  for (const i of interfaces(ws)) {
    const label = i.node.tittel.trim() || moduleName(ws.moduler.find((m) => m.id === i.til));
    if (i.retning === "ukjent") add(i.fra, i.til, label, false);
    if (i.retning === "sender" || i.retning === "begge") add(i.fra, i.til, label, true);
    if (i.retning === "mottar" || i.retning === "begge") add(i.til, i.fra, label, true);
  }
  return [...groups.entries()].map(([key, g]) => ({
    id: key,
    source: g.source,
    target: g.target,
    label: g.labels.length > 2 ? `${g.labels.slice(0, 2).join(" · ")} +${g.labels.length - 2}` : g.labels.join(" · "),
    markerEnd: g.known ? { type: MarkerType.ArrowClosed } : undefined,
    style: g.known ? { strokeWidth: 1.75 } : { strokeWidth: 1.75, strokeDasharray: "6 4" },
  }));
}

/** Oversikten: hver modul er én boks, grensesnittene er pilene. */
export function OverviewCanvas({ actions, onRemoveModule, onTruncated }: Props) {
  const { ws, generation, moveModules, switchModule } = actions;
  const [nodes, setNodes] = useState<ModuleNode[]>(() => toNodes(ws, switchModule, onRemoveModule));
  const dragging = useRef(false);
  /* React Flow eier posisjonene mens en modul dras; ellers speiles nettstedet. */
  useEffect(() => {
    if (!dragging.current) setNodes(toNodes(ws, switchModule, onRemoveModule));
  }, [ws, switchModule, onRemoveModule]);

  const allEdges = useMemo(() => overviewEdges(ws), [ws]);
  const edges = useMemo(() => allEdges.slice(0, MAX_OVERVIEW_EDGES), [allEdges]);
  useEffect(() => {
    if (allEdges.length > MAX_OVERVIEW_EDGES) onTruncated?.(allEdges.length - MAX_OVERVIEW_EDGES);
  }, [allEdges.length, onTruncated]);

  const onNodesChange = useCallback(
    (changes: NodeChange<ModuleNode>[]) => {
      setNodes((ns) => applyNodeChanges(changes, ns));
      const { moved } = summarizeNodeChanges(changes);
      if (Object.keys(moved).length) moveModules(moved);
    },
    [moveModules],
  );

  return (
    <ReactFlow
      key={`oversikt-${generation}`}
      nodes={nodes}
      edges={edges}
      nodeTypes={NODE_TYPES}
      onNodesChange={onNodesChange}
      onNodeDragStart={() => {
        dragging.current = true;
      }}
      onNodeDragStop={() => {
        dragging.current = false;
      }}
      onNodeDoubleClick={(_, node) => switchModule(node.id)}
      nodesConnectable={false}
      nodesFocusable
      elementsSelectable
      edgesFocusable={false}
      fitView
      fitViewOptions={{ padding: 0.3, maxZoom: 1, minZoom: 0.5 }}
      minZoom={0.2}
      maxZoom={1.5}
      zoomOnDoubleClick={false}
      deleteKeyCode={null}
      ariaLabelConfig={ARIA}
      proOptions={{ hideAttribution: true }}
      className="bg-background"
      aria-label="Oversikt over nettstedet. Hver boks er en modul, pilene er grensesnitt."
    >
      <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} className="!bg-background" color="var(--border)" />
      <Controls showInteractive={false} position="bottom-right" className="!m-3 !shadow-none" />
    </ReactFlow>
  );
}
