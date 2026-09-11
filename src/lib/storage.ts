import { emptyWorkflow, workflowSchema, type Workflow } from "./types";

/** Versjonert nøkkel. Endrer du lagret form: ny versjon + migrering, aldri stille overskriving. */
export const STORAGE_KEY = "flytdesigner:v1";

export type ParseResult = { ok: true; workflow: Workflow } | { ok: false; error: string };

/** Tolker JSON (fra lagring eller import). Ukjente felter fjernes, manglende felter fylles inn. */
export function parseWorkflow(json: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, error: "Dette er ikke gyldig JSON." };
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "JSON-en må være et objekt fra Flytdesigner." };
  }
  const merged = { ...emptyWorkflow(), ...(raw as Record<string, unknown>) };
  const result = workflowSchema.safeParse(merged);
  if (!result.success) {
    const first = result.error.issues[0];
    const path = first?.path.join(".") || "ukjent felt";
    return { ok: false, error: `Feil i «${path}»: ${first?.message ?? "ugyldig verdi"}` };
  }
  return { ok: true, workflow: result.data };
}

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function getStorage(): StorageLike | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    // Enkelte nettlesere kaster ved tilgang til localStorage (privat modus, blokkert lagring).
    return null;
  }
}

/** Returnerer lagret flyt, eller null hvis ingenting gyldig er lagret. */
export function loadWorkflow(storage: StorageLike | null = getStorage()): Workflow | null {
  if (!storage) return null;
  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  const parsed = parseWorkflow(raw);
  return parsed.ok ? parsed.workflow : null;
}

export function saveWorkflow(workflow: Workflow, storage: StorageLike | null = getStorage()): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(workflow));
    return true;
  } catch {
    // Lagring full eller blokkert. Appen fungerer videre uten å huske.
    return false;
  }
}

export const serializeWorkflow = (workflow: Workflow): string => JSON.stringify(workflow, null, 2);
