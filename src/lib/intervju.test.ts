import { describe, expect, it } from "vitest";
import { openQuestions } from "./flowBrief";
import { besvart, delTekst, erListe, SPORSMAL, tilModul, tomtSvar, type Svar } from "./intervju";
import { moduleSchema, asFlow } from "./workspace";
import { buildModuleBrief } from "./workspaceBrief";

const fulltSvar = (): Svar => ({
  maal: "Svare kunder som ber om tilbud innen 24 timer",
  virker: "ingen forespørsel er ubesvart etter 24 timer",
  personer: [
    { tekst: "Kunde: ekstern, uten innlogging", valg: null },
    { tekst: "Selger", valg: null },
  ],
  start: "Kunden sender inn skjemaet på nettsiden",
  steg: [
    { tekst: "Appen lagrer forespørselen", valg: null },
    { tekst: "Selger sjekker om kunden finnes fra før", valg: 1 },
    { tekst: "Selger svarer kunden", valg: 1 },
  ],
  regler: [{ tekst: "Over 200 000 kr må daglig leder godkjenne", valg: 2 }],
  data: [{ tekst: "Forespørselen: firma, e-post, hva de ba om, status", valg: 0 }],
  resultater: [{ tekst: "Bekreftelse på e-post til kunden", valg: 0 }],
  systemer: [{ tekst: "Microsoft Teams: varsel i kanalen Salg", valg: 1 }],
  usikkert: [{ tekst: "Skal konsulentene også kunne se dette?", valg: null }],
  navn: "Tilbudsforespørsler",
});

describe("SPORSMAL", () => {
  it("dekker alle feltene i svaret, og de som må besvares kommer i tankemodellens rekkefølge", () => {
    expect(SPORSMAL.map((s) => s.id)).toEqual(Object.keys(tomtSvar()));
    expect(SPORSMAL.filter((s) => !s.valgfritt).map((s) => s.id)).toEqual(["maal", "personer", "start", "steg", "resultater"]);
    expect(erListe("steg")).toBe(true);
    expect(erListe("maal")).toBe(false);
  });
});

describe("besvart", () => {
  it("krever tekst eller minst ett punkt", () => {
    const s = tomtSvar();
    expect(besvart(s, "maal")).toBe(false);
    expect(besvart(s, "steg")).toBe(false);
    s.maal = " x ";
    s.steg.push({ tekst: "a", valg: null });
    expect(besvart(s, "maal")).toBe(true);
    expect(besvart(s, "steg")).toBe(true);
  });
});

describe("delTekst", () => {
  it("deler på første kolon, og klipper lange titler", () => {
    expect(delTekst("Forespørselen: firma, e-post", "Felter: ")).toEqual(["Forespørselen", "Felter: firma, e-post"]);
    expect(delTekst("Bare tittel")).toEqual(["Bare tittel"]);
    const lang = "a".repeat(250);
    const [tittel, notat] = delTekst(lang);
    expect(tittel).toHaveLength(200);
    expect(notat).toBe(lang);
  });
});

describe("tilModul", () => {
  it("lager en gyldig modul der hvert svar er blitt en boks på riktig sted", () => {
    const m = tilModul(fulltSvar(), "m1", { x: 0, y: 0 });
    expect(moduleSchema.safeParse(m).success).toBe(true);
    expect(m.eksempel).toBe(false);
    expect(m.navn).toBe("Tilbudsforespørsler");
    const typer = Object.fromEntries(
      ["maal", "person", "start", "steg", "regel", "data", "resultat", "system", "sporsmal"].map((t) => [t, m.nodes.filter((n) => n.type === t).length]),
    );
    expect(typer).toEqual({ maal: 1, person: 2, start: 1, steg: 3, regel: 1, data: 1, resultat: 1, system: 1, sporsmal: 1 });
    const brief = buildModuleBrief({ versjon: 3, moduler: [m], aktiv: "m1" }, "m1", "2026-09-11");
    expect(brief).toContain("Virker når: ingen forespørsel er ubesvart etter 24 timer");
    expect(brief).toContain("- **Kunde**: ekstern, uten innlogging");
    expect(brief).toContain("2. **Selger sjekker om kunden finnes fra før**\n   - Utføres av: Selger");
    expect(brief).toContain("3. **Selger svarer kunden**\n   - Utføres av: Selger\n   - Regel: Over 200 000 kr må daglig leder godkjenne\n   - Gir: Bekreftelse på e-post til kunden");
    expect(brief).toContain("- **Forespørselen**: Felter: firma, e-post, hva de ba om, status\n  - Brukes i steg: Appen lagrer forespørselen");
    expect(brief).toContain("- **Bekreftelse på e-post til kunden**\n  - Til: Kunde");
    expect(brief).toContain("- **Microsoft Teams**: varsel i kanalen Salg");
    expect(brief).toContain("- Skal konsulentene også kunne se dette?");
    expect(openQuestions(asFlow(m))).toEqual(["Skal konsulentene også kunne se dette?"]);
  });

  it("tåler minste mulige svar, og henger løse ting på siste steg", () => {
    const s = tomtSvar();
    s.maal = "Mål";
    s.personer.push({ tekst: "Selger", valg: null });
    s.start = "Start";
    s.steg.push({ tekst: "Ett", valg: 7 }, { tekst: "To", valg: -1 });
    s.resultater.push({ tekst: "Ut", valg: 9 });
    s.regler.push({ tekst: "Når x", valg: null });
    const m = tilModul(s, "m2", { x: 10, y: 20 });
    expect(moduleSchema.safeParse(m).success).toBe(true);
    expect(m.x).toBe(10);
    const brief = buildModuleBrief({ versjon: 3, moduler: [m], aktiv: "m2" }, "m2", "2026-09-11");
    expect(brief).toContain("2. **To**\n   - Regel: Når x\n   - Gir: Ut");
    expect(brief).not.toContain("Utføres av");
    expect(brief).not.toContain("- Til:");
  });

  it("uten steg lages ett tomt steg, så kjeden henger sammen", () => {
    const s = tomtSvar();
    s.maal = "Mål";
    s.start = "Start";
    const m = tilModul(s, "m3", { x: 0, y: 0 });
    expect(m.nodes.filter((n) => n.type === "steg")).toHaveLength(1);
    expect(moduleSchema.safeParse(m).success).toBe(true);
  });
});
