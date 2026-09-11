import { applyNodeChanges, Background, BackgroundVariant, Controls, MarkerType, ReactFlow, type NodeChange } from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FlowActions } from "@/hooks/useWorkspace";
import { summarizeNodeChanges } from "@/lib/canvasChanges";
import { MAX_OVERVIEW_EDGES, overviewEdges } from "@/lib/overviewEdges";
import { moduleSummary, type Workspace } from "@/lib/workspace";
import { moduleQuestionCount } from "@/lib/workspaceBrief";
import { ModuleCard, type ModuleNode } from "./ModuleCard";
import { ModuleEdge, type ModuleEdgeType } from "./ModuleEdge";

const NODE_TYPES = { modul: ModuleCard };
const EDGE_TYPES = { modul: ModuleEdge };

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

/** Kjent retning: heltrukket med pilhode. Ukjent: stiplet uten. Fester seg i siden som vender mot den andre. */
const toEdges = (ws: Workspace): ModuleEdgeType[] =>
  overviewEdges(ws).map((e) => ({
    id: e.id,
    type: "modul",
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceSide,
    targetHandle: e.targetSide,
    label: e.label,
    markerEnd: e.known ? { type: MarkerType.ArrowClosed } : undefined,
    data: { offset: e.offset, known: e.known },
  }));

/** Oversikten: hver modul er én boks, grensesnittene er pilene. */
export function OverviewCanvas({ actions, onRemoveModule, onTruncated }: Props) {
  const { ws, generation, moveModules, switchModule } = actions;
  const [nodes, setNodes] = useState<ModuleNode[]>(() => toNodes(ws, switchModule, onRemoveModule));
  const dragging = useRef(false);
  /* React Flow eier posisjonene mens en modul dras; ellers speiles nettstedet. */
  useEffect(() => {
    if (!dragging.current) setNodes(toNodes(ws, switchModule, onRemoveModule));
  }, [ws, switchModule, onRemoveModule]);

  const allEdges = useMemo(() => toEdges(ws), [ws]);
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
      edgeTypes={EDGE_TYPES}
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
