import { useCallback, useEffect, useRef, useState } from "react";

const DURATION_MS = 4000;
const DURATION_WITH_ACTION_MS = 8000;

export type ToastAction = { label: string; onClick: () => void };
export type ToastState = { message: string; action?: ToastAction } | null;

export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const show = useCallback(
    (message: string, action?: ToastAction) => {
      clear();
      setToast({ message, action });
      timer.current = setTimeout(() => setToast(null), action ? DURATION_WITH_ACTION_MS : DURATION_MS);
    },
    [clear],
  );

  const dismiss = useCallback(() => {
    clear();
    setToast(null);
  }, [clear]);

  useEffect(() => clear, [clear]);

  return { toast, show, dismiss };
}
