import { describe, expect, it } from "vitest";
import { checkWorkflow, completeness } from "./checks";
import { exampleWorkflow } from "./example";
import { emptyWorkflow } from "./types";

const statusOf = (w: ReturnType<typeof emptyWorkflow>, id: string) => checkWorkflow(w).find((c) => c.id === id)?.status;

describe("checkWorkflow", () => {
  it("er tom for en tom flyt", () => {
    const checks = checkWorkflow(emptyWorkflow());
    expect(checks.every((c) => c.status === "empty")).toBe(true);
    expect(completeness(checks)).toBe(0);
  });

  it("er komplett for eksempelflyten", () => {
    const checks = checkWorkflow(exampleWorkflow());
    expect(checks.every((c) => c.status === "done")).toBe(true);
    expect(completeness(checks)).toBe(100);
  });

  it("markerer påbegynt når bare deler er fylt ut", () => {
    const w = emptyWorkflow();
    w.navn = "Noe";
    expect(statusOf(w, "formaal")).toBe("partial");
    w.brukere = "Kunde";
    expect(statusOf(w, "aktorer")).toBe("partial");
  });

  it("krever navn og type på hver input, og mottaker på hver output", () => {
    const w = emptyWorkflow();
    w.inputs.push({ navn: "Felt", type: "", kilde: "", pakrevd: false, beskrivelse: "" });
    expect(statusOf(w, "inputs")).toBe("partial");
    w.outputs.push({ navn: "Ut", format: "", mottaker: "", kanal: "" });
    expect(statusOf(w, "outputs")).toBe("partial");
  });

  it("krever minst to steg for at steg skal være ferdig", () => {
    const w = emptyWorkflow();
    w.steg.push({ tittel: "Ett steg", beskrivelse: "", regel: "", unntak: "" });
    expect(statusOf(w, "steg")).toBe("partial");
    w.steg.push({ tittel: "To steg", beskrivelse: "", regel: "", unntak: "" });
    expect(statusOf(w, "steg")).toBe("done");
  });

  it("godtar koblinger som ferdig uten koblinger, så lenge avgrensning er satt", () => {
    const w = emptyWorkflow();
    w.avgrensning = "Ingenting mer";
    expect(statusOf(w, "koblinger")).toBe("done");
  });

  it("krever system og retning på hver kobling", () => {
    const w = emptyWorkflow();
    w.avgrensning = "Ingenting mer";
    w.koblinger.push({ system: "Teams", retning: "", hva: "", hvordan: "" });
    expect(statusOf(w, "koblinger")).toBe("partial");
  });

  it("runder prosenten", () => {
    const w = emptyWorkflow();
    w.navn = "a";
    w.problem = "b";
    w.suksess = "c";
    w.brukere = "d";
    w.trigger = "e";
    w.avgrensning = "f";
    expect(completeness(checkWorkflow(w))).toBe(43);
  });
});
