import { useCallback, useEffect, useMemo, useState } from "react";
import { exampleWorkflow } from "@/lib/example";
import { loadWorkflow, saveWorkflow } from "@/lib/storage";
import { emptyItem, emptyWorkflow, type ListKey, type TextKey, type Workflow } from "@/lib/types";

type ListItem<K extends ListKey> = Workflow[K][number];

export function useWorkflow() {
  const [workflow, setWorkflow] = useState<Workflow>(() => loadWorkflow() ?? exampleWorkflow());

  useEffect(() => {
    saveWorkflow(workflow);
  }, [workflow]);

  const setText = useCallback((key: TextKey, value: string) => {
    setWorkflow((w) => ({ ...w, [key]: value, eksempel: false }));
  }, []);

  const addItem = useCallback(<K extends ListKey>(key: K) => {
    setWorkflow((w) => ({ ...w, [key]: [...w[key], emptyItem[key]()], eksempel: false }));
  }, []);

  const updateItem = useCallback(<K extends ListKey>(key: K, index: number, patch: Partial<ListItem<K>>) => {
    setWorkflow((w) => {
      const list = w[key].map((item, i) => (i === index ? { ...item, ...patch } : item));
      return { ...w, [key]: list, eksempel: false };
    });
  }, []);

  const removeItem = useCallback((key: ListKey, index: number) => {
    setWorkflow((w) => ({ ...w, [key]: w[key].filter((_, i) => i !== index), eksempel: false }));
  }, []);

  const replace = useCallback((next: Workflow) => setWorkflow(next), []);
  const reset = useCallback(() => setWorkflow(emptyWorkflow()), []);
  const loadExample = useCallback(() => setWorkflow(exampleWorkflow()), []);

  return useMemo(
    () => ({ workflow, setText, addItem, updateItem, removeItem, replace, reset, loadExample }),
    [workflow, setText, addItem, updateItem, removeItem, replace, reset, loadExample],
  );
}

export type WorkflowActions = ReturnType<typeof useWorkflow>;
