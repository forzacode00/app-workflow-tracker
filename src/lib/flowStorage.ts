import { emptyFlow, flowSchema, tidyEdges, type Flow } from "./flow";
import { migrateV1 } from "./migrateV1";
import { loadWorkflow as loadV1, STORAGE_KEY as V1_KEY, type StorageLike } from "./v1/storage";

export const STORAGE_KEY = "flytdesigner:v2";
export const BACKUP_KEY = "flytdesigner:v2:backup";
export const MAX_JSON_LENGTH = 400_000;

export type ParseResult = { ok: true; flow: Flow } | { ok: false; error: string };

/** Kjører et kart gjennom skjemaet og rydder kanter. Brukes på alt som kommer utenfra, også migrert v1. */
export function validateFlow(candidate: unknown): ParseResult {
  const result = flowSchema.safeParse({ ...emptyFlow(), ...(candidate as Record<string, unknown>) });
  if (!result.success) {
    const first = result.error.issues[0];
    const where = first?.path.length ? first.path.join(".") : "ukjent felt";
    return { ok: false, error: `«${where}» har en verdi Flytdesigner ikke kjenner. Be kollegaen eksportere på nytt.` };
  }
  return { ok: true, flow: tidyEdges(result.data) };
}

/** Tolker JSON fra lagring eller import. Godtar både lerret (v2) og gammelt skjema (v1). */
export function parseFlow(json: string): ParseResult {
  if (json.length > MAX_JSON_LENGTH) return { ok: false, error: "Teksten er for stor til å være en flyt fra Flytdesigner." };
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, error: "Dette er ikke gyldig JSON." };
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "JSON-en må være en flyt eksportert fra Flytdesigner." };
  }
  const obj = raw as Record<string, unknown>;
  if (obj.versjon !== 2 && Array.isArray(obj.steg)) {
    const v1 = loadV1({ getItem: () => json, setItem: () => undefined });
    return v1.status === "ok" ? validateFlow(migrateV1(v1.workflow)) : { ok: false, error: "Flyten fra det gamle skjemaet kunne ikke leses." };
  }
  return validateFlow(obj);
}

function getStorage(): (StorageLike & Partial<Pick<Storage, "removeItem">>) | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    // Privat modus eller blokkert lagring.
    return null;
  }
}

export type LoadResult = { status: "ok"; flow: Flow } | { status: "empty" } | { status: "invalid"; error: string };

/** Leser v2. Finnes ikke v2, løftes v1 hvis den finnes (v1 røres ikke). Uleselig v2 kopieres til backup. */
export function loadFlow(storage: StorageLike | null = getStorage()): LoadResult {
  if (!storage) return { status: "empty" };
  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return { status: "empty" };
  }
  if (raw) {
    const parsed = parseFlow(raw);
    if (parsed.ok) return { status: "ok", flow: parsed.flow };
    try {
      storage.setItem(BACKUP_KEY, raw);
    } catch {
      // Beholder i det minste originalen under STORAGE_KEY til neste skriving.
    }
    return { status: "invalid", error: parsed.error };
  }
  const v1 = loadV1(storage);
  if (v1.status === "ok") {
    const migrated = validateFlow(migrateV1(v1.workflow));
    return migrated.ok ? { status: "ok", flow: migrated.flow } : { status: "invalid", error: migrated.error };
  }
  return { status: "empty" };
}

export function readBackup(storage: StorageLike | null = getStorage()): string | null {
  if (!storage) return null;
  try {
    return storage.getItem(BACKUP_KEY);
  } catch {
    return null;
  }
}

/** Lagrer v2. En vellykket lagring fjerner den gamle v1-nøkkelen, så det ikke ligger to kopier. */
export function saveFlow(flow: Flow, storage: (StorageLike & Partial<Pick<Storage, "removeItem">>) | null = getStorage()): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(flow));
  } catch {
    // Lagring full eller blokkert.
    return false;
  }
  try {
    storage.removeItem?.(V1_KEY);
  } catch {
    // Uviktig om den blir liggende.
  }
  return true;
}

export const serializeFlow = (flow: Flow): string => JSON.stringify(flow, null, 2);
