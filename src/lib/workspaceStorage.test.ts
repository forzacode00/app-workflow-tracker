import { describe, expect, it } from "vitest";
import { exampleFlow } from "./flowExample";
import { exampleWorkflow } from "./v1/example";
import { STORAGE_KEY as V1_KEY } from "./v1/storage";
import { seedWorkspace } from "./workspace";
import { exampleWorkspace } from "./workspaceExample";
import { BACKUP_KEY, loadWorkspace, MAX_JSON_LENGTH, parseWorkspace, readBackup, saveWorkspace, serializeWorkspace, STORAGE_KEY, V2_KEY } from "./workspaceStorage";

const memoryStorage = () => {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    map,
  };
};

describe("parseWorkspace", () => {
  it("leser et nettsted (v3)", () => {
    const r = parseWorkspace(serializeWorkspace(exampleWorkspace()));
    expect(r.ok && r.kind).toBe("workspace");
    expect(r.ok && r.kind === "workspace" && r.workspace.moduler).toHaveLength(2);
  });
  it("gir ett kart (v2) som modul med ny id, uten fremmede referanser", () => {
    const f = exampleFlow();
    f.nodes[0]!.ref = "m1";
    const r = parseWorkspace(JSON.stringify(f));
    expect(r.ok && r.kind).toBe("module");
    expect(r.ok && r.kind === "module" && r.module.navn).toBe("Tilbudsforespørsel");
    expect(r.ok && r.kind === "module" && r.module.id.startsWith("m")).toBe(true);
    expect(r.ok && r.kind === "module" && r.module.nodes.some((n) => n.ref)).toBe(false);
  });
  it("løfter gammelt skjema (v1) til modul", () => {
    const r = parseWorkspace(JSON.stringify(exampleWorkflow()));
    expect(r.ok && r.kind === "module" && r.module.nodes.some((n) => n.type === "steg")).toBe(true);
  });
  it("avviser ugyldig JSON, feil form, vilkårlige objekter, for stor tekst og ukjent felt", () => {
    expect(parseWorkspace("{nei").ok).toBe(false);
    expect(parseWorkspace("[]").ok).toBe(false);
    expect(parseWorkspace("{}").ok).toBe(false);
    expect(parseWorkspace(JSON.stringify({ foo: 1 })).ok).toBe(false);
    expect(parseWorkspace("x".repeat(MAX_JSON_LENGTH + 1)).ok).toBe(false);
    const r = parseWorkspace(JSON.stringify({ versjon: 3, aktiv: "a", moduler: [{ id: "a", navn: "", nodes: [{ id: "n", type: "nei", tittel: "", notat: "", x: 0, y: 0 }], edges: [] }] }));
    expect(!r.ok && r.error).toContain("moduler.0.nodes.0.type");
  });
  it("avviser duplikate boks-id-er inne i en modul", () => {
    const n = { type: "steg", tittel: "", notat: "", x: 0, y: 0 };
    const r = parseWorkspace(JSON.stringify({ versjon: 3, aktiv: "a", moduler: [{ id: "a", navn: "", nodes: [{ ...n, id: "dup" }, { ...n, id: "dup" }], edges: [] }] }));
    expect(!r.ok && r.error).toContain("moduler.0.nodes.1.id");
  });
  it("bruker skjemaets egen melding ved duplikat modul-id, også midt i listen", () => {
    const m = { id: "a", navn: "", nodes: [], edges: [] };
    const r = parseWorkspace(JSON.stringify({ versjon: 3, aktiv: "a", moduler: [m, { ...m, id: "b" }, m] }));
    expect(!r.ok && r.error).toBe("«moduler.2.id»: Samme modul-id brukes to ganger. Be kollegaen eksportere på nytt.");
  });
});

describe("loadWorkspace og saveWorkspace", () => {
  it("lagrer og leser tilbake identisk, og rydder eldre nøkler", () => {
    const s = memoryStorage();
    s.setItem(V2_KEY, "gammel");
    s.setItem(V1_KEY, "eldre");
    const ws = exampleWorkspace();
    expect(saveWorkspace(ws, s)).toBe(true);
    expect(loadWorkspace(s)).toEqual({ status: "ok", workspace: ws });
    expect(s.map.has(V2_KEY)).toBe(false);
    expect(s.map.has(V1_KEY)).toBe(false);
  });
  it("løfter v2 til ett nettsted med modul «m1» når v3 mangler; v2 vinner over v1", () => {
    const s = memoryStorage();
    s.setItem(V2_KEY, JSON.stringify(exampleFlow()));
    s.setItem(V1_KEY, JSON.stringify({ ...exampleWorkflow(), navn: "Gammel" }));
    const r = loadWorkspace(s);
    expect(r.status === "ok" && r.workspace.moduler[0]?.id).toBe("m1");
    expect(r.status === "ok" && r.workspace.aktiv).toBe("m1");
    expect(r.status === "ok" && r.workspace.moduler[0]?.navn).toBe("Tilbudsforespørsel");
  });
  it("løfter v1 når verken v3 eller v2 finnes", () => {
    const s = memoryStorage();
    s.setItem(V1_KEY, JSON.stringify(exampleWorkflow()));
    expect(loadWorkspace(s).status).toBe("ok");
  });
  it("gir «empty» uten lagring eller data", () => {
    expect(loadWorkspace(null)).toEqual({ status: "empty" });
    expect(loadWorkspace(memoryStorage())).toEqual({ status: "empty" });
  });
  it("tar kopi av uleselig v3 og rører ikke originalen", () => {
    const s = memoryStorage();
    s.setItem(STORAGE_KEY, "{korrupt");
    expect(loadWorkspace(s).status).toBe("invalid");
    expect(readBackup(s)).toBe("{korrupt");
    expect(s.map.get(STORAGE_KEY)).toBe("{korrupt");
  });
  it("tar kopi av uleselig v2 før den ryddes ved lagring, og prøver ikke v1", () => {
    const s = memoryStorage();
    s.setItem(V2_KEY, "{korrupt");
    s.setItem(V1_KEY, JSON.stringify(exampleWorkflow()));
    expect(loadWorkspace(s).status).toBe("invalid");
    expect(readBackup(s)).toBe("{korrupt");
    saveWorkspace(seedWorkspace(), s);
    expect(s.map.has(V2_KEY)).toBe(false);
    expect(s.map.get(BACKUP_KEY)).toBe("{korrupt");
  });
  it("eksport og import gir identisk nettsted", () => {
    const ws = seedWorkspace();
    const r = parseWorkspace(serializeWorkspace(ws));
    expect(r.ok && r.kind === "workspace" && r.workspace).toEqual(ws);
  });
  it("returnerer false når lagring kaster", () => {
    expect(saveWorkspace(seedWorkspace(), { getItem: () => null, setItem: () => { throw new Error("full"); } })).toBe(false);
  });
});
