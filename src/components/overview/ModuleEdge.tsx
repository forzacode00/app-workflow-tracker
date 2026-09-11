import { BaseEdge, EdgeLabelRenderer, getBezierPath, type Edge, type EdgeProps } from "@xyflow/react";
import { memo } from "react";
import { cn } from "@/lib/utils";

export type ModuleEdgeData = {
  /** Loddrett forskyvning i piksler, så to piler mellom samme moduler ikke ligger oppå hverandre. */
  offset: number;
  /** Ukjent retning tegnes stiplet uten pilhode. */
  known: boolean;
};
export type ModuleEdgeType = Edge<ModuleEdgeData, "modul">;

/** Pil mellom to moduler, med etikett som følger pilen og kan forskyves fra motsatt pil. */
export const ModuleEdge = memo(function ModuleEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, label, data, markerEnd }: EdgeProps<ModuleEdgeType>) {
  const offset = data?.offset ?? 0;
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY: sourceY + offset,
    targetX,
    targetY: targetY + offset,
    sourcePosition,
    targetPosition,
  });
  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={{ strokeWidth: 1.75, strokeDasharray: data?.known === false ? "6 4" : undefined }} />
      {label && (
        <EdgeLabelRenderer>
          <div
            className={cn(
              "pointer-events-none absolute max-w-[220px] truncate rounded border border-border bg-card px-1.5 py-0.5 text-[11px] text-foreground",
              data?.known === false && "text-muted-foreground italic",
            )}
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY + (offset < 0 ? -14 : offset > 0 ? 14 : 0)}px)` }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});
