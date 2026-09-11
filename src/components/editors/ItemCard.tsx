import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";

type Props = {
  onRemove: () => void;
  removeLabel: string;
  foot?: ReactNode;
  children: ReactNode;
};

/** Ramme rundt én rad i en liste (én input, ett steg, én kobling). */
export function ItemCard({ onRemove, removeLabel, foot, children }: Props) {
  return (
    <div className="grid gap-2 rounded-md border border-border bg-background p-3">
      {children}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">{foot}</div>
        <Button variant="danger" size="sm" onClick={onRemove} aria-label={removeLabel}>
          Fjern
        </Button>
      </div>
    </div>
  );
}

export function EmptyList({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed border-input px-3 py-2.5 text-[13.5px] text-muted-foreground">{text}</div>
  );
}
