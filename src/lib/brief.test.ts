import { describe, expect, it } from "vitest";
import { buildBrief, lines } from "./brief";
import { exampleWorkflow } from "./example";
import { emptyWorkflow } from "./types";

describe("lines", () => {
  it("splitter på linjeskift og fjerner tomme linjer", () => {
    expect(lines(" a \n\n b\n")).toEqual(["a", "b"]);
  });
});

describe("buildBrief", () => {
  it("er deterministisk for samme flyt og dato", () => {
    const w = exampleWorkflow();
    expect(buildBrief(w, "2026-09-11")).toBe(buildBrief(w, "2026-09-11"));
  });

  it("tar med alle seksjoner i fast rekkefølge", () => {
    const brief = buildBrief(exampleWorkflow(), "2026-09-11");
    const headings = brief.match(/^## .*$/gm) ?? [];
    expect(headings).toEqual([
      "## Problemet i dag",
      "## Slik vet vi at det virker (akseptansekriterier)",
      "## Brukere og roller",
      "## Trigger",
      "## Inputs",
      "## Datamodell",
      "## Steg i flyten",
      "## Outputs",
      "## Koblinger til andre systemer og flyter",
      "## Utenfor scope i MVP",
      "## Krav til bygget",
    ]);
  });

  it("markerer manglende innhold i stedet for å hoppe over seksjoner", () => {
    const brief = buildBrief(emptyWorkflow(), "2026-09-11");
    expect(brief).toContain("# Brief: (uten navn)");
    expect(brief).toContain("(ikke beskrevet)");
    expect(brief).toContain("Ingen. Flyten står alene.");
    expect(brief).toContain("(ikke beskrevet, så bygg minst mulig)");
  });

  it("nummererer steg og legger regler under steget", () => {
    const brief = buildBrief(exampleWorkflow(), "2026-09-11");
    expect(brief).toContain("1. **Ta imot forespørsel**");
    expect(brief).toContain("   - Regel: Hvis e-post mangler eller er ugyldig: vis feil i skjemaet, ikke lagre.");
  });

  it("escaper pipe-tegn så Markdown-tabellen ikke brytes", () => {
    const w = emptyWorkflow();
    w.inputs.push({ navn: "A | B", type: "Tall", kilde: "", pakrevd: true, beskrivelse: "x\ny" });
    const brief = buildBrief(w, "2026-09-11");
    expect(brief).toContain("| A \\| B | Tall | ? | ja | x y |");
  });

  it("skriver datoen i bunnen", () => {
    expect(buildBrief(emptyWorkflow(), "2026-01-02")).toMatch(/Laget med Flytdesigner 2026-01-02\.$/);
  });
});
