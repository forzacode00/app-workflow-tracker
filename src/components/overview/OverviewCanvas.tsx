import { applyNodeChanges, Background, BackgroundVariant, Controls, MarkerType, ReactFlow, type Edge, type NodeChange } from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FlowActions } from "@/hooks/useWorkspace";
import { summarizeNodeChanges } from "@/lib/canvasChanges";
import { interfaces, moduleName, moduleSummary, type Workspace } from "@/lib/workspace";
import { moduleQuestionCount } from "@/lib/workspaceBrief";
import { ModuleCard, type ModuleNode } from "./ModuleCard";

const NODE_TYPES = { modul: ModuleCard };

const ARIA = {
  "node.a11yDescription.default": "Trykk Enter for å velge modulen. Piltaster flytter den.",
  "controls.zoomIn.ariaLabel": "Zoom inn",
  "controls.zoomOut.ariaLabel": "Zoom ut",
  "controls.fitView.ariaLabel": "Vis hele nettstedet",
};

type Props = {
  actions: Pick<FlowActions, "ws" | "generation" | "moveModules" | "switchModule">;
};

const toNodes = (ws: Workspace, onOpen: (id: string) => void): ModuleNode[] =>
  ws.moduler.map((m) => {
    const s = moduleSummary(m);
    return {
      id: m.id,
      type: "modul",
      position: { x: m.x, y: m.y },
      data: { navn: s.navn, maal: s.maal, bokser: s.bokser, sporsmal: moduleQuestionCount(m), aktiv: m.id === ws.aktiv, eksempel: m.eksempel, onOpen },
    };
  });

/** Oversikten: hver modul er én boks, grensesnittene er pilene. Pilens retning er dataflyten. */
export function OverviewCanvas({ actions }: Props) {
  const { ws, generation, moveModules, switchModule } = actions;
  const [nodes, setNodes] = useState<ModuleNode[]>(() => toNodes(ws, switchModule));
  const dragging = useRef(false);
  /* React Flow eier posisjonene mens en modul dras; ellers speiles arbeidsområdet. */
  useEffect(() => {
    if (!dragging.current) setNodes(toNodes(ws, switchModule));
  }, [ws, switchModule]);

  const edges = useMemo<Edge[]>(() => {
    const out: Edge[] = [];
    for (const i of interfaces(ws)) {
      const label = i.node.tittel.trim() || moduleName(ws.moduler.find((m) => m.id === i.til)!);
      const forward = i.retning === "sender" || i.retning === "begge" || i.retning === "ukjent";
      const backward = i.retning === "mottar" || i.retning === "begge";
      if (forward) out.push({ id: `${i.node.id}-ut`, source: i.fra, target: i.til, label, markerEnd: { type: MarkerType.ArrowClosed }, style: { strokeWidth: 1.75 } });
      if (backward) out.push({ id: `${i.node.id}-inn`, source: i.til, target: i.fra, label, markerEnd: { type: MarkerType.ArrowClosed }, style: { strokeWidth: 1.75 } });
    }
    return out;
  }, [ws]);

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
      <Controls showInteractive={false} position="top-right" className="!m-3 !shadow-none" />
    </ReactFlow>
  );
}
