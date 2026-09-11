import {
  applyNodeChanges,
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  ReactFlow,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type FinalConnectionState,
  type NodeChange,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FlowActions } from "@/hooks/useFlow";
import { removedEdgeIds, summarizeNodeChanges } from "@/lib/canvasChanges";
import { NODE_META, type Flow, type NodeType } from "@/lib/flow";
import { NodeCard, type CardNode } from "./NodeCard";

const NODE_TYPES = { boks: NodeCard };
const NODE_W = 220;
const NODE_H = 80;

/* React Flow leser disse opp for skjermleser. Standardtekstene er engelske. */
const ARIA = {
  "node.a11yDescription.default": "Trykk Enter for å velge boksen. Piltaster flytter den, Delete fjerner den.",
  "node.a11yDescription.keyboardDisabled": "Trykk Enter for å velge boksen.",
  "node.a11yDescription.ariaLiveMessage": ({ direction, x, y }: { direction: string; x: number; y: number }) =>
    `Flyttet ${direction} til ${x}, ${y}.`,
  "edge.a11yDescription.default": "Trykk Delete for å fjerne pilen.",
  "controls.ariaLabel": "Zoom og utsnitt",
  "controls.zoomIn.ariaLabel": "Zoom inn",
  "controls.zoomOut.ariaLabel": "Zoom ut",
  "controls.fitView.ariaLabel": "Vis hele flyten",
  "controls.interactive.ariaLabel": "Lås eller lås opp lerretet",
  "minimap.ariaLabel": "Oversiktskart",
  "handle.ariaLabel": "Koblingspunkt",
};

type Props = {
  actions: Pick<
    FlowActions,
    "flow" | "generation" | "lastAdded" | "selectedId" | "addNode" | "moveNodes" | "removeNodes" | "removeEdges" | "connect" | "select"
  >;
  onRemoved: (count: number) => void;
};

const toCards = (flow: Flow, selectedId: string | null, onGrow: CardNode["data"]["onGrow"]): CardNode[] =>
  flow.nodes.map((n) => ({
    id: n.id,
    type: "boks",
    position: { x: n.x, y: n.y },
    selected: n.id === selectedId,
    data: { node: n, onGrow },
  }));

/**
 * Lerretet. Kartet i hooken er sannheten for innhold og koblinger. React Flow eier posisjonene
 * mens en boks dras, og kartet får dem når draingen er ferdig.
 */
export function FlowCanvas({ actions, onRemoved }: Props) {
  const { flow, generation, lastAdded, selectedId, addNode, moveNodes, removeNodes, removeEdges, connect, select } = actions;
  const { fitView, setCenter, getViewport, screenToFlowPosition } = useReactFlow();
  const wrapper = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const onGrow = useCallback((fromId: string, type: NodeType) => addNode(type, fromId), [addNode]);

  const [cards, setCards] = useState<CardNode[]>(() => toCards(flow, selectedId, onGrow));
  useEffect(() => {
    if (!dragging.current) setCards(toCards(flow, selectedId, onGrow));
  }, [flow, selectedId, onGrow]);

  /* Nytt kart (tøm, eksempel, import, angre): vis hele flyten. */
  useEffect(() => {
    if (generation > 0) void fitView({ padding: 0.25, maxZoom: 1, duration: 200 });
  }, [generation, fitView]);

  /* Ny boks utenfor utsnittet: panorer så den blir synlig, uten å endre zoom. */
  useEffect(() => {
    if (!lastAdded || !wrapper.current) return;
    const node = flow.nodes.find((n) => n.id === lastAdded);
    if (!node) return;
    const { x, y, zoom } = getViewport();
    const { clientWidth: w, clientHeight: h } = wrapper.current;
    const left = (node.x + x) * zoom;
    const top = (node.y + y) * zoom;
    const inside = left >= 0 && top >= 0 && left + NODE_W * zoom <= w && top + NODE_H * zoom <= h;
    if (!inside) void setCenter(node.x + NODE_W / 2, node.y + NODE_H / 2, { zoom, duration: 250 });
  }, [lastAdded, flow.nodes, getViewport, setCenter]);

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
      setCards((cs) => applyNodeChanges(changes, cs));
      const { moved, removed, selected } = summarizeNodeChanges(changes);
      if (Object.keys(moved).length) moveNodes(moved);
      if (removed.length) onRemoved(removeNodes(removed));
      if (selected !== undefined) select(selected);
    },
    [moveNodes, removeNodes, select, onRemoved],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const removed = removedEdgeIds(changes);
      if (removed.length) onRemoved(removeEdges(removed));
    },
    [removeEdges, onRemoved],
  );

  const onConnect = useCallback(
    (c: Connection) => {
      if (c.source && c.target) connect(c.source, c.target);
    },
    [connect],
  );

  /* Slipp en pil på tomt lerret: lag den boksen som naturlig følger, der pilen ble sluppet. */
  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent, state: FinalConnectionState) => {
      if (state.isValid || !state.fromNode || state.fromHandle?.type !== "source") return;
      const from = flow.nodes.find((n) => n.id === state.fromNode?.id);
      const type = from ? NODE_META[from.type].next[0] : undefined;
      if (!type) return;
      const point = "changedTouches" in event ? event.changedTouches[0] : event;
      if (!point) return;
      const pos = screenToFlowPosition({ x: point.clientX, y: point.clientY });
      addNode(type, from?.id, { x: pos.x, y: pos.y - NODE_H / 2 });
    },
    [flow.nodes, addNode, screenToFlowPosition],
  );

  return (
    <div ref={wrapper} className="h-full w-full">
      <ReactFlow
        nodes={cards}
        edges={edges}
        nodeTypes={NODE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        onNodeDragStart={() => {
          dragging.current = true;
        }}
        onNodeDragStop={() => {
          dragging.current = false;
        }}
        onPaneClick={() => select(null)}
        fitView
        fitViewOptions={{ padding: 0.25, maxZoom: 1 }}
        minZoom={0.2}
        maxZoom={2}
        connectionRadius={40}
        zoomOnDoubleClick={false}
        edgesFocusable={false}
        deleteKeyCode={["Backspace", "Delete"]}
        ariaLabelConfig={ARIA}
        proOptions={{ hideAttribution: true }}
        className="bg-background"
        aria-label="Lerret med flyten. Dra bokser, trekk piler mellom dem."
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} className="!bg-background" color="var(--border)" />
        <Controls showInteractive={false} position="bottom-right" className="!m-3 !shadow-none" />
      </ReactFlow>
    </div>
  );
}
