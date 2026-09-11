import { validateFlow } from "./flowStorage";
import { migrateV1 } from "./migrateV1";
import { loadWorkflow as loadV1, STORAGE_KEY as V1_KEY, type StorageLike } from "./v1/storage";
import { newModuleId, tidyWorkspace, workspaceFromFlow, workspaceSchema, type Module, type Workspace } from "./workspace";

export const STORAGE_KEY = "flytdesigner:v3";
export const BACKUP_KEY = "flytdesigner:v3:backup";
/** Nøkkelen det gamle kartet (v2) lå under. Leses bare for løfting. */
export const V2_KEY = "flytdesigner:v2";
export const MAX_JSON_LENGTH = 2_000_000;
/** Satt når brukeren har gått forbi velkomstskjermen én gang. */
export const WELCOME_KEY = "flytdesigner:velkommen";

export type ParseResult =
  | { ok: true; kind: "workspace"; workspace: Workspace }
  /** JSON-en var ett kart (v2 eller v1). Kalleren velger om det blir ny modul eller erstatter alt. */
  | { ok: true; kind: "module"; module: Module }
  | { ok: false; error: string };

function validateWorkspace(candidate: unknown): ParseResult {
  const result = workspaceSchema.safeParse(candidate);
  if (!result.success) {
    const first = result.error.issues[0];
    const where = first?.path.length ? first.path.join(".") : "ukjent felt";
    const why = first?.code === "custom" ? first.message : "har en verdi Flytdesigner ikke kjenner";
    return { ok: false, error: `«${where}»: ${why}. Be kollegaen eksportere på nytt.` };
  }
  return { ok: true, kind: "workspace", workspace: tidyWorkspace(result.data) };
}

/** Tolker JSON fra lagring eller import: nettsted (v3), ett kart (v2) eller gammelt skjema (v1). */
export function parseWorkspace(json: string): ParseResult {
  if (json.length > MAX_JSON_LENGTH) return { ok: false, error: "Teksten er for stor til å være fra Flytdesigner." };
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, error: "Dette er ikke gyldig JSON." };
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "JSON-en må være eksportert fra Flytdesigner." };
  }
  const obj = raw as Record<string, unknown>;
  if (obj.versjon === 3) return validateWorkspace(obj);
  let flow;
  if (obj.versjon === 2) {
    flow = validateFlow(obj);
  } else if (obj.versjon === undefined && Array.isArray(obj.steg)) {
    const v1 = loadV1({ getItem: () => json, setItem: () => undefined });
    if (v1.status !== "ok") return { ok: false, error: "Flyten fra det gamle skjemaet kunne ikke leses." };
    flow = validateFlow(migrateV1(v1.workflow));
  } else {
    return { ok: false, error: "JSON-en må være eksportert fra Flytdesigner." };
  }
  if (!flow.ok) return flow;
  const ws = workspaceFromFlow(flow.flow, newModuleId());
  return { ok: true, kind: "module", module: ws.moduler[0]! };
}

type Store = StorageLike & Partial<Pick<Storage, "removeItem">>;

function getStorage(): Store | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    // Privat modus eller blokkert lagring.
    return null;
  }
}

export type LoadResult = { status: "ok"; workspace: Workspace } | { status: "empty" } | { status: "invalid"; error: string };

const read = (storage: StorageLike, key: string): string | null => {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
};

const backUp = (storage: StorageLike, raw: string) => {
  try {
    storage.setItem(BACKUP_KEY, raw);
  } catch {
    // Får vi ikke skrevet kopien, ligger originalen fortsatt under sin nøkkel til neste lagring.
  }
};

/**
 * Leser v3. Mangler den, løftes v2 (ett kart) eller v1 (skjema) til ett nettsted.
 * Alt som ligger lagret men ikke kan leses, kopieres til BACKUP_KEY før noe annet skjer.
 */
export function loadWorkspace(storage: StorageLike | null = getStorage()): LoadResult {
  if (!storage) return { status: "empty" };
  const raw = read(storage, STORAGE_KEY);
  if (raw) {
    const parsed = parseWorkspace(raw);
    if (parsed.ok && parsed.kind === "workspace") return { status: "ok", workspace: parsed.workspace };
    backUp(storage, raw);
    return { status: "invalid", error: parsed.ok ? "Lagringen inneholdt ett kart, ikke et nettsted." : parsed.error };
  }
  for (const key of [V2_KEY, V1_KEY]) {
    const older = read(storage, key);
    if (!older) continue;
    const parsed = parseWorkspace(older);
    if (parsed.ok && parsed.kind === "module") {
      return { status: "ok", workspace: tidyWorkspace({ versjon: 3, moduler: [{ ...parsed.module, id: "m1" }], aktiv: "m1" }) };
    }
    backUp(storage, older);
    return { status: "invalid", error: parsed.ok ? "Eldre lagring hadde uventet form." : parsed.error };
  }
  return { status: "empty" };
}

export function readBackup(storage: StorageLike | null = getStorage()): string | null {
  return storage ? read(storage, BACKUP_KEY) : null;
}

/** Lagrer v3. En vellykket lagring rydder eldre nøkler (de er enten løftet eller kopiert til backup). */
export function saveWorkspace(ws: Workspace, storage: Store | null = getStorage()): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(ws));
  } catch {
    // Lagring full eller blokkert.
    return false;
  }
  for (const key of [V2_KEY, V1_KEY]) {
    try {
      storage.removeItem?.(key);
    } catch {
      // Uviktig om de blir liggende.
    }
  }
  return true;
}

export function hasSeenWelcome(storage: StorageLike | null = getStorage()): boolean {
  return storage ? read(storage, WELCOME_KEY) === "1" : true;
}

export function markWelcomeSeen(storage: Store | null = getStorage()): void {
  try {
    storage?.setItem(WELCOME_KEY, "1");
  } catch {
    // Får vi ikke lagret, vises velkomsten igjen neste gang. Ufarlig.
  }
}

export const serializeWorkspace = (ws: Workspace): string => JSON.stringify(ws, null, 2);
