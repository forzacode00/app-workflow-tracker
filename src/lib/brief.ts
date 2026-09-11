import type { Workflow } from "./types";

export const lines = (text: string): string[] =>
  text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

const orMissing = (value: string, fallback = "(ikke beskrevet)") =>
  value.trim() ? value.trim() : fallback;

/** Markdown-cellene skal ikke bryte tabellen. */
const cell = (value: string) => value.replace(/\|/g, "\\|").replace(/\n/g, " ").trim() || "?";

const BUILD_REQUIREMENTS = [
  "Norsk bokmål i all UI-tekst, «du»-form, korte verb-knapper.",
  "Mobil først (360 px), tilgjengelig (tastatur, kontrast, aria-label på ikonknapper).",
  "Hver liste har tom-, laste- og feiltilstand.",
  "Valider all input ved grensen. Ikke lagre ugyldige data.",
  "Rollene over styrer hvem som kan lese og skrive hva. Ingen data skal være åpne for alle.",
  "Lever en kort README som forklarer hvordan flyten startes og testes.",
];

/**
 * Bygger briefen som limes inn i Claude. Ren tekst i Markdown, deterministisk
 * for samme input og dato, slik at den kan testes og diffes.
 */
export function buildBrief(w: Workflow, today: string = new Date().toISOString().slice(0, 10)): string {
  const out: string[] = [];
  const heading = (title: string) => out.push("", `## ${title}`, "");

  out.push(`# Brief: ${w.navn.trim() || "(uten navn)"}`);
  out.push("");
  out.push(
    `Dette er en arbeidsflyt beskrevet av ${w.eier.trim() || "en kollega"} hos Involved Consulting, som ikke er utvikler. Bygg en MVP som gjør nøyaktig dette, ikke mer. Spør om det som er uklart før du antar.`,
  );

  heading("Problemet i dag");
  out.push(orMissing(w.problem));

  heading("Slik vet vi at det virker (akseptansekriterier)");
  const suksess = lines(w.suksess);
  out.push(...(suksess.length ? suksess.map((l) => `- ${l}`) : ["(ikke beskrevet)"]));

  heading("Brukere og roller");
  const brukere = lines(w.brukere);
  out.push(...(brukere.length ? brukere.map((l) => `- ${l}`) : ["(ikke beskrevet)"]));

  heading("Trigger");
  out.push(`${w.triggerType ? `${w.triggerType}: ` : ""}${orMissing(w.trigger)}`);

  heading("Inputs");
  if (w.inputs.length) {
    out.push("| Felt | Type | Kilde | Påkrevd | Merknad |", "|---|---|---|---|---|");
    for (const i of w.inputs) {
      out.push(
        `| ${cell(i.navn)} | ${cell(i.type)} | ${cell(i.kilde)} | ${i.pakrevd ? "ja" : "nei"} | ${i.beskrivelse.trim() ? cell(i.beskrivelse) : ""} |`,
      );
    }
  } else {
    out.push("(ingen)");
  }

  heading("Datamodell");
  if (w.data.length) {
    for (const d of w.data) {
      out.push(`### ${orMissing(d.entitet, "?")}`);
      out.push(`- Felter: ${orMissing(d.felter, "?")}`);
      out.push(`- Eier: ${orMissing(d.eier, "?")}`);
      out.push(`- Lagres: ${orMissing(d.lagring, "?")}`);
      out.push("");
    }
  } else {
    out.push("(ingen)");
  }

  heading("Steg i flyten");
  if (w.steg.length) {
    w.steg.forEach((s, idx) => {
      out.push(`${idx + 1}. **${orMissing(s.tittel, "?")}**${s.beskrivelse.trim() ? ` ${s.beskrivelse.trim()}` : ""}`);
      if (s.regel.trim()) out.push(`   - Regel: ${s.regel.trim()}`);
    });
  } else {
    out.push("(ingen)");
  }

  heading("Outputs");
  if (w.outputs.length) {
    out.push("| Output | Format | Mottaker | Hvordan og når |", "|---|---|---|---|");
    for (const o of w.outputs) {
      out.push(`| ${cell(o.navn)} | ${cell(o.format)} | ${cell(o.mottaker)} | ${o.kanal.trim() ? cell(o.kanal) : ""} |`);
    }
  } else {
    out.push("(ingen)");
  }

  heading("Koblinger til andre systemer og flyter");
  if (w.koblinger.length) {
    for (const k of w.koblinger) {
      const retning = k.retning ? k.retning.toLowerCase() : "retning ukjent";
      out.push(
        `- **${orMissing(k.system, "?")}**, ${retning}. Data: ${orMissing(k.hva, "?")}. Hvordan: ${orMissing(k.hvordan, "?")}`,
      );
    }
  } else {
    out.push("Ingen. Flyten står alene.");
  }

  heading("Utenfor scope i MVP");
  out.push(orMissing(w.avgrensning, "(ikke beskrevet, så bygg minst mulig)"));

  heading("Krav til bygget");
  out.push(...BUILD_REQUIREMENTS.map((r) => `- ${r}`));

  out.push("", "---", `Laget med Flytdesigner ${today}.`);
  return out.join("\n");
}
