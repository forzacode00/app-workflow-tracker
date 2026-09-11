import type { ToastState } from "@/hooks/useToast";

type Props = { toast: ToastState; onDismiss: () => void };

/** Kort melding nederst på siden, med valgfri handling (f.eks. «Angre»). */
export function Toast({ toast, onDismiss }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-16 left-1/2 z-20 flex w-max max-w-[calc(100vw-1.5rem)] -translate-x-1/2 items-center gap-3 rounded-md bg-foreground px-4 py-2 text-[13.5px] text-background shadow-lg transition-opacity ${toast ? "opacity-100" : "pointer-events-none opacity-0"}`}
    >
      <span>{toast?.message}</span>
      {toast?.action && (
        <button
          type="button"
          className="min-h-9 shrink-0 rounded px-2 font-semibold underline underline-offset-2 focus-visible:ring-2 focus-visible:ring-background focus-visible:outline-none"
          onClick={() => {
            toast.action?.onClick();
            onDismiss();
          }}
        >
          {toast.action.label}
        </button>
      )}
    </div>
  );
}
