import { describe, expect, it } from "vitest";
import { exampleWorkflow } from "./example";
import {
  BACKUP_KEY,
  describePath,
  loadWorkflow,
  MAX_JSON_LENGTH,
  migrateWorkflow,
  parseWorkflow,
  readBackup,
  saveWorkflow,
  serializeWorkflow,
  STORAGE_KEY,
  type StorageLike,
} from "./storage";
import { emptyWorkflow, MAX_ITEMS } from "./types";

const memoryStorage = () => {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    map,
  };
};

const throwingStorage: StorageLike = {
  getItem: () => {
    throw new Error("blokkert");
  },
  setItem: () => {
    throw new Error("full");
  },
};

describe("parseWorkflow", () => {
  it("gir feil på tekst som ikke er JSON", () => {
    const r = parseWorkflow("{ikke json");
    expect(r).toEqual({ ok: false, error: "Dette er ikke gyldig JSON." });
  });

  it("gir feil på JSON som ikke er et objekt", () => {
    expect(parseWorkflow("[1,2]").ok).toBe(false);
    expect(parseWorkflow("null").ok).toBe(false);
  });

  it("avviser for stor tekst før den tolkes", () => {
    const r = parseWorkflow("x".repeat(MAX_JSON_LENGTH + 1));
    expect(!r.ok && r.error).toContain("for stor");
  });

  it("fyller inn manglende felter fra tom flyt", () => {
    const r = parseWorkflow(JSON.stringify({ navn: "Test" }));
    expect(r.ok && r.workflow.navn).toBe("Test");
    expect(r.ok && r.workflow.inputs).toEqual([]);
    expect(r.ok && r.workflow.ukjent).toBe("");
  });

  it("godtar rader fra første versjon uten de nye feltene", () => {
    const r = parseWorkflow(
      JSON.stringify({
        steg: [{ tittel: "a", beskrivelse: "", regel: "" }],
        data: [{ entitet: "b", felter: "", eier: "", lagring: "" }],
      }),
    );
    expect(r.ok && r.workflow.steg[0]?.unntak).toBe("");
    expect(r.ok && r.workflow.data[0]?.statuser).toBe("");
  });

  it("avviser ugyldige valg i enum-felt med norsk feilmelding", () => {
    const r = parseWorkflow(JSON.stringify({ triggerType: "Noe helt annet" }));
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toBe("«Hva starter flyten» har en verdi Flytdesigner ikke kjenner. Be kollegaen eksportere på nytt.");
  });

  it("peker på riktig rad når et listeelement er ugyldig", () => {
    const r = parseWorkflow(JSON.stringify({ inputs: [{ navn: "a", type: "Foo", kilde: "", pakrevd: true, beskrivelse: "" }] }));
    expect(!r.ok && r.error).toContain("«Det som kommer inn, rad 1»");
  });

  it("avviser listeelementer som mangler felt uten standardverdi", () => {
    expect(parseWorkflow(JSON.stringify({ inputs: [{ navn: "x" }] })).ok).toBe(false);
  });

  it("avviser for lange tekster med egen melding", () => {
    const r = parseWorkflow(JSON.stringify({ navn: "x".repeat(201) }));
    expect(!r.ok && r.error).toContain("er for langt");
  });

  it("avviser lister som er null eller for lange", () => {
    expect(parseWorkflow(JSON.stringify({ inputs: null })).ok).toBe(false);
    const many = Array.from({ length: MAX_ITEMS + 1 }, () => ({ tittel: "", beskrivelse: "", regel: "", unntak: "" }));
    expect(parseWorkflow(JSON.stringify({ steg: many })).ok).toBe(false);
  });

  it("fjerner ukjente felter, også i rader", () => {
    const r = parseWorkflow(JSON.stringify({ navn: "Test", hemmelig: "nei", outputs: [{ navn: "o", format: "", mottaker: "", kanal: "", ekstra: 1 }] }));
    expect(r.ok && "hemmelig" in r.workflow).toBe(false);
    expect(r.ok && "ekstra" in (r.workflow.outputs[0] ?? {})).toBe(false);
  });
});

describe("migrering", () => {
  it("løfter omdøpte trigger-verdier fra første versjon", () => {
    const r = parseWorkflow(JSON.stringify({ triggerType: "Bruker fyller ut et skjema" }));
    expect(r.ok && r.workflow.triggerType).toBe("Noen fyller ut et skjema");
  });

  it("lar dagens verdier og tom streng være i fred", () => {
    expect(migrateWorkflow({ triggerType: "" })).toEqual({ triggerType: "" });
    expect(migrateWorkflow({ triggerType: "Data endres i et annet system" })).toEqual({ triggerType: "Data endres i et annet system" });
    expect(migrateWorkflow({ navn: "x" })).toEqual({ navn: "x" });
  });
});

describe("describePath", () => {
  it("oversetter feltnavn og rad", () => {
    expect(describePath(["inputs", 0, "type"])).toBe("Det som kommer inn, rad 1");
    expect(describePath(["navn"])).toBe("Navn på flyten");
    expect(describePath([])).toBe("ukjent felt");
  });
});

describe("lagring", () => {
  it("lagrer og leser tilbake identisk flyt", () => {
    const s = memoryStorage();
    const w = exampleWorkflow();
    expect(saveWorkflow(w, s)).toBe(true);
    expect(loadWorkflow(s)).toEqual({ status: "ok", workflow: w });
  });

  it("gir «empty» når ingenting er lagret eller lagring mangler", () => {
    expect(loadWorkflow(memoryStorage())).toEqual({ status: "empty" });
    expect(loadWorkflow(null)).toEqual({ status: "empty" });
  });

  it("gir «invalid» og tar kopi når lagret verdi ikke kan leses", () => {
    const s = memoryStorage();
    s.setItem(STORAGE_KEY, "{korrupt");
    const r = loadWorkflow(s);
    expect(r.status).toBe("invalid");
    expect(s.map.get(BACKUP_KEY)).toBe("{korrupt");
    expect(readBackup(s)).toBe("{korrupt");
    expect(s.map.get(STORAGE_KEY)).toBe("{korrupt");
  });

  it("returnerer false når lagring kaster, og «empty» når lesing kaster", () => {
    expect(saveWorkflow(emptyWorkflow(), throwingStorage)).toBe(false);
    expect(loadWorkflow(throwingStorage)).toEqual({ status: "empty" });
    expect(readBackup(throwingStorage)).toBeNull();
  });

  it("fungerer uten lagring (null)", () => {
    expect(saveWorkflow(emptyWorkflow(), null)).toBe(false);
    expect(readBackup(null)).toBeNull();
  });

  it("eksport og import gir identisk tilstand", () => {
    const w = exampleWorkflow();
    const r = parseWorkflow(serializeWorkflow(w));
    expect(r.ok && r.workflow).toEqual(w);
  });
});
