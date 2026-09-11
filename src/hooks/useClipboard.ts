import { useCallback } from "react";

/** Kopierer tekst. Returnerer false hvis nettleseren nekter, så UI kan vise en manuell vei. */
export function useClipboard() {
  return useCallback(async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }, []);
}
