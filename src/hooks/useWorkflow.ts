import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { exampleWorkflow } from "@/lib/example";
import { loadWorkflow, saveWorkflow, type LoadResult } from "@/lib/storage";
import { emptyItem, emptyWorkflow, type ListKey, type TextKey, type Workflow } from "@/lib/types";

type ListItem<K extends ListKey> = Workflow[K][number];

export type StorageState = {
  /** Sist forsøkte lagring feilet (privat modus, full lagring). */
  saveFailed: boolean;
  /** Det lå noe lagret som ikke lot seg lese. Kopien ligger under BACKUP_KEY. */
  loadError: string | null;
};

function initial(result: LoadResult): Workflow {
  return result.status === "ok" ? result.workflow : exampleWorkflow();
}

export function useWorkflow() {
  const [loaded] = useState<LoadResult>(() => loadWorkflow());
  const [workflow, setWorkflow] = useState<Workflow>(() => initial(loaded));
  const [saveFailed, setSaveFailed] = useState(false);
  /** Ikke skriv til lagring før brukeren har endret noe. Ellers overskrives uleselig data av eksempelet. */
  const dirty = useRef(false);
  /** Forrige flyt før «start på nytt» eller import, så handlingen kan angres. */
  const previous = useRef<Workflow | null>(null);

  useEffect(() => {
    if (!dirty.current) return;
    setSaveFailed(!saveWorkflow(workflow));
  }, [workflow]);

  /** Alle redigeringer går her: markerer som endret og nullstiller eksempel-flagget. */
  const edit = useCallback((fn: (w: Workflow) => Workflow) => {
    dirty.current = true;
    setWorkflow((w) => ({ ...fn(w), eksempel: false }));
  }, []);

  const setText = useCallback(
    <K extends TextKey>(key: K, value: Workflow[K]) => edit((w) => ({ ...w, [key]: value })),
    [edit],
  );

  const addItem = useCallback(
    <K extends ListKey>(key: K) => edit((w) => ({ ...w, [key]: [...w[key], emptyItem[key]()] })),
    [edit],
  );

  const updateItem = useCallback(
    <K extends ListKey>(key: K, index: number, patch: Partial<ListItem<K>>) =>
      edit((w) => ({ ...w, [key]: w[key].map((item, i) => (i === index ? { ...item, ...patch } : item)) })),
    [edit],
  );

  const removeItem = useCallback(
    (key: ListKey, index: number) => edit((w) => ({ ...w, [key]: w[key].filter((_, i) => i !== index) })),
    [edit],
  );

  /** Erstatter hele flyten (import). Kan angres med `undo`. */
  const replace = useCallback(
    (next: Workflow) => {
      setWorkflow((w) => {
        previous.current = w;
        return next;
      });
      edit((w) => w);
    },
    [edit],
  );

  const reset = useCallback(() => replace(emptyWorkflow()), [replace]);

  /** Laster eksempelet (beholder eksempel-flagget). Kan angres med `undo`. */
  const loadExample = useCallback(() => {
    dirty.current = true;
    setWorkflow((w) => {
      previous.current = w;
      return exampleWorkflow();
    });
  }, []);

  /** Angrer siste `replace`/`reset`. Returnerer false hvis det ikke er noe å angre. */
  const undo = useCallback((): boolean => {
    const prev = previous.current;
    if (!prev) return false;
    previous.current = null;
    dirty.current = true;
    setWorkflow(prev);
    return true;
  }, []);

  const storage: StorageState = useMemo(
    () => ({ saveFailed, loadError: loaded.status === "invalid" ? loaded.error : null }),
    [saveFailed, loaded],
  );

  return useMemo(
    () => ({ workflow, storage, setText, addItem, updateItem, removeItem, replace, reset, loadExample, undo }),
    [workflow, storage, setText, addItem, updateItem, removeItem, replace, reset, loadExample, undo],
  );
}

export type WorkflowActions = ReturnType<typeof useWorkflow>;
