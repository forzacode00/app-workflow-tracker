import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  ReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import { useCallback, useMemo } from "react";
import type { FlowActions } from "@/hooks/useFlow";
import { NODE_META } from "@/lib/flow";
import { NodeCard, type CardNode } from "./NodeCard";

const NODE_TYPES = { boks: NodeCard };

type Props = { actions: FlowActions };

/** Lerretet. Kartet i `actions.flow` er sannheten; React Flow får en avledet kopi hver render. */
export function FlowCanvas({ actions }: Props) {
  const { flow, generation, selectedId, addNode, moveNodes, removeNodes, removeEdges, connect, select } = actions;

  const onGrow = useCallback(
    (fromId: string) => {
      const from = flow.nodes.find((n) => n.id === fromId);
      const type = from ? NODE_META[from.type].next[0] : undefined;
      if (type) addNode(type, fromId);
    },
    [flow.nodes, addNode],
  );

  const nodes = useMemo<CardNode[]>(
    () =>
      flow.nodes.map((n) => ({
        id: n.id,
        type: "boks",
        position: { x: n.x, y: n.y },
        selected: n.id === selectedId,
        data: { node: n, onGrow },
      })),
    [flow.nodes, selectedId, onGrow],
  );

  const edges = useMemo<Edge[]>(
    () =>
      flow.edges.map((e) => ({
        id: e.id,
        source: e.from,
        target: e.to,
        markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
        style: { strokeWidth: 1.75 },
      })),
    [flow.edges],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange<CardNode>[]) => {
      const positions: Record<string, { x: number; y: number }> = {};
      const removed: string[] = [];
      for (const c of changes) {
        if (c.type === "position" && c.position) positions[c.id] = { x: Math.round(c.position.x), y: Math.round(c.position.y) };
        else if (c.type === "remove") removed.push(c.id);
        else if (c.type === "select") select(c.selected ? c.id : null);
      }
      if (Object.keys(positions).length) moveNodes(positions);
      if (removed.length) removeNodes(removed);
    },
    [moveNodes, removeNodes, select],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const removed = changes.filter((c) => c.type === "remove").map((c) => c.id);
      if (removed.length) removeEdges(removed);
    },
    [removeEdges],
  );

  const onConnect = useCallback(
    (c: Connection) => {
      if (c.source && c.target) connect(c.source, c.target);
    },
    [connect],
  );

  return (
    <ReactFlow
      key={generation}
      nodes={nodes}
      edges={edges}
      nodeTypes={NODE_TYPES}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onPaneClick={() => select(null)}
      fitView
      fitViewOptions={{ padding: 0.25, maxZoom: 1 }}
      minZoom={0.2}
      maxZoom={2}
      deleteKeyCode={["Backspace", "Delete"]}
      proOptions={{ hideAttribution: true }}
      className="bg-background"
      aria-label="Lerret med flyten. Dra bokser, trekk piler mellom dem."
    >
      <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} className="!bg-background" color="var(--border)" />
      <Controls showInteractive={false} position="bottom-right" className="!m-3 !shadow-none" />
    </ReactFlow>
  );
}
