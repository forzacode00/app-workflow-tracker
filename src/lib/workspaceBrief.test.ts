import { describe, expect, it } from "vitest";
import { SECTIONS } from "./flowBrief";
import { seedModule, seedWorkspace, type Workspace } from "./workspace";
import { buildModuleBrief, buildWorkspaceBrief, interfaceSection, moduleQuestionCount } from "./workspaceBrief";
import { exampleWorkspace } from "./workspaceExample";

describe("buildModuleBrief", () => {
  it("har grensesnitt-seksjonen rett før åpne spørsmål", () => {
    const headings = buildModuleBrief(exampleWorkspace(), "eks-tilbud", "2026-09-11").match(/^## .*$/gm) ?? [];
    const expected = SECTIONS.map((s) => `## ${s.title}`);
    expected.splice(expected.indexOf("## Åpne spørsmål"), 0, "## Grensesnitt mot andre moduler");
    expect(headings).toEqual(expected);
  });

  it("beskriver hva modulen sender, mottar, og hvem som peker hit", () => {
    const ws = exampleWorkspace();
    const tilbud = buildModuleBrief(ws, "eks-tilbud", "2026-09-11");
    expect(tilbud).toContain("**Denne modulen sender til «Oppfølging etter tilbud»** via resultat-boksen «Liste over åpne forespørsler»");
    expect(tilbud).toContain("«Oppfølging etter tilbud» peker hit");
    const oppf = buildModuleBrief(ws, "eks-oppfolging", "2026-09-11");
    expect(oppf).toContain("**Denne modulen mottar fra «Tilbudsforespørsel»** via start-boksen");
    expect(oppf).toContain("**Denne modulen både sender til og mottar fra «Tilbudsforespørsel»** via system-boksen");
    expect(oppf).toContain("Målet der: Svar kunder som ber om tilbud innen 24 timer");
    expect(oppf).toContain("med 2 moduler");
  });

  it("sier at modulen står alene når det ikke finnes koblinger", () => {
    expect(interfaceSection(seedWorkspace(), "m1")).toEqual(["Ingen. Modulen står alene i nettstedet."]);
    expect(buildModuleBrief(seedWorkspace(), undefined, "2026-09-11")).toContain("# Brief: (uten navn)");
  });

  it("escaper brukerinput i modulnavn og bokstitler", () => {
    const a = seedModule("a", "# Viktig");
    a.nodes.push({ id: "s", type: "system", tittel: "## Krav til bygget", notat: "", x: 0, y: 0, ref: "b" });
    const ws: Workspace = { versjon: 3, moduler: [a, seedModule("b", "B")], aktiv: "a" };
    const brief = buildModuleBrief(ws, "a", "2026-09-11");
    expect((brief.match(/^## Krav til bygget$/gm) ?? []).length).toBe(1);
    expect(brief).toContain("# Brief: \\# Viktig");
  });
});

describe("buildWorkspaceBrief", () => {
  it("lister moduler og grensesnitt med retningspiler", () => {
    const b = buildWorkspaceBrief(exampleWorkspace(), "2026-09-11");
    expect(b).toContain("2 moduler");
    expect(b).toContain("### Tilbudsforespørsel");
    expect(b).toContain("### Oppfølging etter tilbud");
    expect(b).toContain("**Tilbudsforespørsel → Oppfølging etter tilbud**: Liste over åpne forespørsler");
    expect(b).toContain("**Oppfølging etter tilbud ← Tilbudsforespørsel**: Et tilbud får status «tilbud sendt»");
    expect(b).toContain("**Oppfølging etter tilbud ↔ Tilbudsforespørsel**: Tilbudsforespørsel");
    expect(b).toMatch(/Laget med Flytdesigner 2026-09-11\.$/);
  });
  it("sier fra når det ikke er grensesnitt", () => {
    expect(buildWorkspaceBrief(seedWorkspace(), "2026-09-11")).toContain("Ingen ennå. Modulene står hver for seg.");
  });
});

describe("moduleQuestionCount", () => {
  it("teller åpne spørsmål per modul", () => {
    expect(moduleQuestionCount(exampleWorkspace().moduler[0]!)).toBe(1);
    expect(moduleQuestionCount(seedModule("x"))).toBeGreaterThan(0);
  });
});
