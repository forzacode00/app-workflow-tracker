import { describe, expect, it } from "vitest";
import { checkWorkflow, completeness } from "./checks";
import { exampleWorkflow } from "./example";
import { emptyWorkflow } from "./types";

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
    expect(checkWorkflow(w).find((c) => c.id === "formaal")?.status).toBe("partial");
  });

  it("krever minst to steg for at steg skal være ferdig", () => {
    const w = emptyWorkflow();
    w.steg.push({ tittel: "Ett steg", beskrivelse: "", regel: "" });
    expect(checkWorkflow(w).find((c) => c.id === "steg")?.status).toBe("partial");
    w.steg.push({ tittel: "To steg", beskrivelse: "", regel: "" });
    expect(checkWorkflow(w).find((c) => c.id === "steg")?.status).toBe("done");
  });

  it("godtar koblinger som ferdig uten koblinger, så lenge avgrensning er satt", () => {
    const w = emptyWorkflow();
    w.avgrensning = "Ingenting mer";
    expect(checkWorkflow(w).find((c) => c.id === "koblinger")?.status).toBe("done");
  });

  it("krever system og retning på hver kobling", () => {
    const w = emptyWorkflow();
    w.avgrensning = "Ingenting mer";
    w.koblinger.push({ system: "Teams", retning: "", hva: "", hvordan: "" });
    expect(checkWorkflow(w).find((c) => c.id === "koblinger")?.status).toBe("partial");
  });
});
