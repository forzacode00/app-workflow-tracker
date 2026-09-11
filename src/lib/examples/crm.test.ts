import { describe, expect, it } from "vitest";
import { interfaces, workspaceSchema } from "../workspace";
import { buildModuleBrief, buildOrder, buildWorkspaceBrief } from "../workspaceBrief";
import { openQuestions } from "../flowBrief";
import { asFlow } from "../workspace";
import { crmWorkspace } from "./crm";

describe("CRM-eksempelet", () => {
  it("er et gyldig nettsted med fem moduler og unike id-er", () => {
    const ws = crmWorkspace();
    expect(workspaceSchema.safeParse(ws).success).toBe(true);
    expect(ws.moduler.map((m) => m.navn)).toEqual(["Kontakter", "Muligheter", "Tilbud", "Oppfølging", "Rapportering"]);
    const ids = ws.moduler.flatMap((m) => m.nodes.map((n) => `${m.id}/${n.id}`));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("har grensesnitt mellom alle modulene, i begge retninger der det trengs", () => {
    const ws = crmWorkspace();
    const pairs = new Set(interfaces(ws).map((i) => `${i.fra}>${i.til}`));
    expect(pairs).toContain("crm-muligheter>crm-kontakter");
    expect(pairs).toContain("crm-muligheter>crm-tilbud");
    expect(pairs).toContain("crm-tilbud>crm-oppfolging");
    expect(pairs).toContain("crm-oppfolging>crm-kontakter");
    expect(pairs).toContain("crm-rapportering>crm-muligheter");
    expect(interfaces(ws).every((i) => i.retning !== "ukjent")).toBe(true);
  });

  it("har ingen åpne spørsmål utover de bevisste spørsmålsboksene", () => {
    for (const m of crmWorkspace().moduler) {
      const q = openQuestions(asFlow(m));
      const bevisste = m.nodes.filter((n) => n.type === "sporsmal").length;
      expect(q, m.navn).toHaveLength(bevisste);
    }
  });

  it("gir en byggerekkefølge som starter med Kontakter", () => {
    expect(buildOrder(crmWorkspace()).map((m) => m.navn)[0]).toBe("Kontakter");
  });

  it("briefene bygges uten feil og nevner grensesnittene", () => {
    const ws = crmWorkspace();
    const tilbud = buildModuleBrief(ws, "crm-tilbud", "2026-09-11");
    expect(tilbud).toContain("**Denne modulen mottar fra «Muligheter»**");
    expect(tilbud).toContain("**Denne modulen sender til «Oppfølging»**");
    expect(buildWorkspaceBrief(ws, "2026-09-11")).toContain("5 moduler");
  });
});
