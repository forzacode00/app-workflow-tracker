import { emptyWorkflow, workflowSchema, type Workflow } from "./types";

/** Versjonert nøkkel. Endrer du lagret form på en måte gammel data ikke passerer: ny versjon + migrering. */
export const STORAGE_KEY = "flytdesigner:v1";
/** Kopi av en lagret verdi som ikke lot seg lese, så ingenting går tapt ved feil. */
export const BACKUP_KEY = "flytdesigner:v1:backup";
/** Større JSON enn dette tolkes ikke. En full flyt innenfor skjemaet er langt under. */
export const MAX_JSON_LENGTH = 200_000;

export type ParseResult = { ok: true; workflow: Workflow } | { ok: false; error: string };

const FIELD_NAMES: Record<string, string> = {
  navn: "Navn på flyten",
  eier: "Hvem eier flyten",
  problem: "Problemet i dag",
  suksess: "Slik vet vi at det virker",
  brukere: "Brukere og roller",
  triggerType: "Hva starter flyten",
  trigger: "Beskriv starten",
  avgrensning: "Utenfor første versjon",
  ukjent: "Det dere ikke vet ennå",
  inputs: "Det som kommer inn",
  data: "Det som lagres",
  steg: "Steg",
  outputs: "Det som kommer ut",
  koblinger: "Koblinger",
};

/** Gjør en zod-sti som «inputs.0.type» om til «Det som kommer inn, rad 1». */
export function describePath(path: readonly PropertyKey[]): string {
  const [head, index] = path;
  const name = typeof head === "string" ? (FIELD_NAMES[head] ?? head) : "ukjent felt";
  return typeof index === "number" ? `${name}, rad ${index + 1}` : name;
}

/** Verdier fra tidligere versjoner som er omdøpt. Gammel tekst → ny tekst. */
const LEGACY_TRIGGER_TYPES: Record<string, string> = {
  "Bruker fyller ut et skjema": "Noen fyller ut et skjema",
  "Bruker trykker på en knapp i en eksisterende app": "Noen trykker på en knapp i en app vi har",
  "E-post eller melding kommer inn": "En e-post eller melding kommer inn",
  "Tidsstyrt, kjører på et fast tidspunkt": "Et fast tidspunkt, f.eks. hver natt",
};

/** Løfter data fra tidligere versjoner til dagens form før validering. Rører ikke ukjente verdier. */
export function migrateWorkflow(raw: Record<string, unknown>): Record<string, unknown> {
  const triggerType = raw.triggerType;
  if (typeof triggerType === "string" && triggerType in LEGACY_TRIGGER_TYPES) {
    return { ...raw, triggerType: LEGACY_TRIGGER_TYPES[triggerType] };
  }
  return raw;
}

/** Tolker JSON (fra lagring eller import). Ukjente felter fjernes, manglende toppnivåfelter fylles inn. */
export function parseWorkflow(json: string): ParseResult {
  if (json.length > MAX_JSON_LENGTH) {
    return { ok: false, error: "Teksten er for stor til å være en flyt fra Flytdesigner." };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, error: "Dette er ikke gyldig JSON." };
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "JSON-en må være en flyt eksportert fra Flytdesigner." };
  }
  const merged = { ...emptyWorkflow(), ...migrateWorkflow(raw as Record<string, unknown>) };
  const result = workflowSchema.safeParse(merged);
  if (!result.success) {
    const first = result.error.issues[0];
    const where = first ? describePath(first.path) : "ukjent felt";
    const tooLong = first?.code === "too_big";
    return {
      ok: false,
      error: tooLong
        ? `«${where}» er for langt. Kort ned teksten, eller be kollegaen eksportere på nytt.`
        : `«${where}» har en verdi Flytdesigner ikke kjenner. Be kollegaen eksportere på nytt.`,
    };
  }
  return { ok: true, workflow: result.data };
}

export type StorageLike = Pick<Storage, "getItem" | "setItem">;

function getStorage(): StorageLike | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    // Enkelte nettlesere kaster ved tilgang til localStorage (privat modus, blokkert lagring).
    return null;
  }
}

export type LoadResult =
  | { status: "ok"; workflow: Workflow }
  | { status: "empty" }
  /** Noe lå lagret, men lot seg ikke lese. Verdien er kopiert til BACKUP_KEY. */
  | { status: "invalid"; error: string };

/** Leser lagret flyt. Skiller mellom «ingenting lagret» og «lagret, men uleselig», så uleselig aldri overskrives stille. */
export function loadWorkflow(storage: StorageLike | null = getStorage()): LoadResult {
  if (!storage) return { status: "empty" };
  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return { status: "empty" };
  }
  if (!raw) return { status: "empty" };
  const parsed = parseWorkflow(raw);
  if (parsed.ok) return { status: "ok", workflow: parsed.workflow };
  try {
    storage.setItem(BACKUP_KEY, raw);
  } catch {
    // Får vi ikke lagret kopien, beholder vi i det minste originalen under STORAGE_KEY til neste skriving.
  }
  return { status: "invalid", error: parsed.error };
}

/** Rå tekst som ble kopiert til BACKUP_KEY fordi den ikke lot seg lese, eller null. */
export function readBackup(storage: StorageLike | null = getStorage()): string | null {
  if (!storage) return null;
  try {
    return storage.getItem(BACKUP_KEY);
  } catch {
    return null;
  }
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
