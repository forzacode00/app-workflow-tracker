import type { ToastState } from "@/hooks/useToast";

type Props = { toast: ToastState; onDismiss: () => void };

/** Kort melding nederst på siden, med valgfri handling (f.eks. «Angre»). */
export function Toast({ toast, onDismiss }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-16 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-md bg-foreground px-4 py-2 text-[13.5px] text-background shadow-lg transition-opacity lg:bottom-4 ${toast ? "opacity-100" : "pointer-events-none opacity-0"}`}
    >
      {toast?.message}
      {toast?.action && (
        <button
          type="button"
          className="min-h-9 rounded px-2 font-semibold underline underline-offset-2 focus-visible:ring-2 focus-visible:ring-background focus-visible:outline-none"
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
