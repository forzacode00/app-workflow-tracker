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
    expect(ws.moduler.map((m) => m.navn)).toEqual(["Kontakter", "Muligheter", "Tilbud", "Aktiviteter", "Rapportering"]);
    const ids = ws.moduler.flatMap((m) => m.nodes.map((n) => `${m.id}/${n.id}`));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("har grensesnitt mellom alle modulene, i begge retninger der det trengs", () => {
    const ws = crmWorkspace();
    const pairs = new Set(interfaces(ws).map((i) => `${i.fra}>${i.til}`));
    expect(pairs).toContain("crm-muligheter>crm-kontakter");
    expect(pairs).toContain("crm-muligheter>crm-tilbud");
    expect(pairs).toContain("crm-tilbud>crm-aktiviteter");
    expect(pairs).toContain("crm-aktiviteter>crm-kontakter");
    expect(pairs).toContain("crm-rapportering>crm-aktiviteter");
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
    expect(buildOrder(crmWorkspace()).map((m) => m.navn)).toEqual(["Kontakter", "Muligheter", "Tilbud", "Aktiviteter", "Rapportering"]);
  });

  it("briefene bygges uten feil og nevner grensesnittene", () => {
    const ws = crmWorkspace();
    const tilbud = buildModuleBrief(ws, "crm-tilbud", "2026-09-11");
    expect(tilbud).toContain("- **Mottar fra «Muligheter»**\n  - «En mulighet er i fase tilbud» (start her).");
    expect(tilbud).toContain("  - «Mulighet i fase tilbud» (resultat i «Muligheter»). Felter som sendes: mulighet-id, firma, kontaktperson, verdi, hva kunden ba om, tjeneste. Data «Mulighet»: Felter:");
    expect(tilbud).toContain("- **Sender til «Aktiviteter»**\n  - «Tilbud sendt» (resultat her). Felter som sendes: tilbud-id, mulighet-id, firma, kontaktperson, selger, sendt dato, gyldig til. Data «Tilbud», se «Data som lagres».");
    /* Databoksens innhold står i seksjonen «Data som lagres», ikke gjentatt per kanal. */
    expect(tilbud.match(/Statuser: utkast → til godkjenning/g)).toHaveLength(1);
    expect(tilbud).toContain("- Til: Kunde");
    expect(buildWorkspaceBrief(ws, "2026-09-11")).toContain("5 moduler");
  });
});
