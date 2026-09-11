import { bygg, type ModulSpec, type StegSpec } from "./bygg";
import { SHORT } from "./flow";
import type { Module } from "./workspace";

/**
 * Intervjuet: appen stiller spørsmålene i tankemodellen ett om gangen, på vanlig norsk, og svarene
 * blir en modul med bokser og piler. Brukeren trenger ikke vite hva en «regel» eller et «resultat» er.
 */

/** Ett punkt i en liste. `valg` peker på en person eller et steg, alt etter spørsmålet. -1 betyr «skjer automatisk». */
export type Punkt = { tekst: string; valg: number | null };

export type Svar = {
  maal: string;
  virker: string;
  personer: Punkt[];
  start: string;
  steg: Punkt[];
  regler: Punkt[];
  data: Punkt[];
  resultater: Punkt[];
  systemer: Punkt[];
  usikkert: Punkt[];
  navn: string;
};

export type SporsmalId = keyof Svar;
export type ListeId = { [K in SporsmalId]: Svar[K] extends Punkt[] ? K : never }[SporsmalId];
export type TekstId = Exclude<SporsmalId, ListeId>;

export type Sporsmal = {
  id: SporsmalId;
  tittel: string;
  hjelp: string;
  eksempel: string;
  valgfritt: boolean;
  /** Hvert punkt i listen kan knyttes til en person eller et steg. `auto` gir et eget valg som betyr «ingen person, det skjer av seg selv» (valg -1). */
  velg?: { fra: "personer" | "steg"; label: string; ingen: string; auto?: string };
};

export const SPORSMAL: Sporsmal[] = [
  {
    id: "maal",
    tittel: "Hva er tungvint i dag, og hva vil du ha i stedet?",
    hjelp: "Én setning holder. Dette blir målet for det Claude skal bygge.",
    eksempel: "Svare kunder som ber om tilbud innen 24 timer, i stedet for etter fem dager",
    valgfritt: false,
  },
  {
    id: "virker",
    tittel: "Hvordan ser du at det virker?",
    hjelp: "Hva er annerledes når det er ferdig? Gjerne med et tall.",
    eksempel: "Ingen forespørsel er ubesvart etter 24 timer",
    valgfritt: true,
  },
  {
    id: "personer",
    tittel: "Hvem gjør dette i dag?",
    hjelp: "Roller, ikke navn. Legg til én om gangen. Ta med kunden hvis kunden er involvert.",
    eksempel: "Selger",
    valgfritt: false,
  },
  {
    id: "start",
    tittel: "Hva er det som setter det i gang?",
    hjelp: "Det som skjer først, i dag eller slik du vil ha det: en e-post kommer inn, noen fyller ut et skjema, det blir fredag. Hvis ingenting setter det i gang i dag, er det ofte akkurat det appen skal gjøre.",
    eksempel: "Kunden sender inn skjemaet på nettsiden",
    valgfritt: false,
  },
  {
    id: "steg",
    tittel: "Hva skjer så, steg for steg?",
    hjelp: "Slik du vil at det skal gå. Ett steg er én ting som skjer hver gang. Legg til ett om gangen, i rekkefølge.",
    eksempel: "Selger sjekker om kunden finnes fra før",
    valgfritt: false,
    velg: { fra: "personer", label: "Hvem gjør det?", ingen: "Ikke valgt", auto: "Skjer automatisk" },
  },
  {
    id: "regler",
    tittel: "Er det unntak eller grenser?",
    hjelp: "Noe som bare gjelder noen ganger: «Når … skal …». Ta gjerne med et tall og et eksempel.",
    eksempel: "Over 200 000 kr må daglig leder godkjenne",
    valgfritt: true,
    velg: { fra: "steg", label: "Gjelder i steget", ingen: "Vet ikke ennå" },
  },
  {
    id: "data",
    tittel: "Hva må appen holde styr på?",
    hjelp: "Opplysninger som følger saken fra start til slutt. Skriv hva det er, kolon, og hva det inneholder.",
    eksempel: "Forespørselen: firma, e-post, hva de ba om, status",
    valgfritt: true,
    velg: { fra: "steg", label: "Dukker opp første gang i steget", ingen: "Vet ikke ennå" },
  },
  {
    id: "resultater",
    tittel: "Hva skal komme ut til slutt?",
    hjelp: "Tingen noen sitter igjen med: en e-post, en PDF, en side, en liste.",
    eksempel: "Bekreftelse på e-post til kunden",
    valgfritt: false,
    velg: { fra: "personer", label: "Til hvem?", ingen: "Ingen bestemt" },
  },
  {
    id: "systemer",
    tittel: "Henger det sammen med noe dere allerede bruker?",
    hjelp: "Teams, Outlook, et regneark, et fagsystem. Claude får beskjed om ikke å endre det.",
    eksempel: "Microsoft Teams",
    valgfritt: true,
    velg: { fra: "steg", label: "Brukes i steget", ingen: "Vet ikke ennå" },
  },
  {
    id: "usikkert",
    tittel: "Er det noe dere ikke vet ennå?",
    hjelp: "Claude spør om dette i stedet for å gjette.",
    eksempel: "Skal konsulentene også kunne se dette?",
    valgfritt: true,
  },
  {
    id: "navn",
    tittel: "Hva vil du kalle dette?",
    hjelp: "Et kort navn på det du nettopp beskrev. Du kan beskrive flere ting etterpå, og de kan henge sammen.",
    eksempel: "Tilbudsforespørsler",
    valgfritt: true,
  },
];

export const erListe = (id: SporsmalId): id is ListeId => Array.isArray(tomtSvar()[id]);

export const tomtSvar = (): Svar => ({
  maal: "",
  virker: "",
  personer: [],
  start: "",
  steg: [],
  regler: [],
  data: [],
  resultater: [],
  systemer: [],
  usikkert: [],
  navn: "",
});

/** Er spørsmålet besvart godt nok til å gå videre? */
export function besvart(svar: Svar, id: SporsmalId): boolean {
  const v = svar[id];
  return Array.isArray(v) ? v.length > 0 : v.trim().length > 0;
}

/** «Forespørselen: firma, e-post» → tittel «Forespørselen», notat «Felter: firma, e-post». Ellers klippes lang tekst til tittel + notat. */
export function delTekst(tekst: string, prefiks = ""): [tittel: string, notat?: string] {
  const t = tekst.trim();
  const i = t.indexOf(":");
  if (i > 0 && i < SHORT) return [t.slice(0, i).trim(), `${prefiks}${t.slice(i + 1).trim()}`];
  if (t.length <= SHORT) return [t];
  return [`${t.slice(0, SHORT - 1).trimEnd()}…`, t];
}

const valg = (p: Punkt, maks: number): number | undefined => (p.valg !== null && p.valg >= 0 && p.valg < maks ? p.valg : undefined);

/** Svarene som modul. Regler, data og systemer henger på steget som ble valgt, ellers på det siste. Resultater på siste steg. */
export function tilModul(svar: Svar, id: string, plass: { x: number; y: number }): Module {
  const [maal, maalNotatFraTekst] = delTekst(svar.maal);
  const virker = svar.virker.trim() ? `Virker når: ${svar.virker.trim()}` : "";
  const maalNotat = [maalNotatFraTekst, virker].filter(Boolean).join("\n") || undefined;
  const antallSteg = Math.max(svar.steg.length, 1);
  const siste = antallSteg - 1;
  const stegIndeks = (p: Punkt) => valg(p, antallSteg) ?? siste;

  const [startTittel, startNotat] = delTekst(svar.start);
  const stegSpec: StegSpec[] = (svar.steg.length ? svar.steg : [{ tekst: "(steg mangler)", valg: null }]).map((s) => {
    const [tittel, notat] = delTekst(s.tekst);
    const hvem = valg(s, svar.personer.length);
    return { tittel, notat, hvem, regler: [], bruker: [], system: [], resultater: [] };
  });
  svar.regler.forEach((r) => stegSpec[stegIndeks(r)]!.regler!.push(delTekst(r.tekst)));
  svar.data.forEach((d, i) => (stegSpec[stegIndeks(d)]!.bruker as number[]).push(i));
  svar.systemer.forEach((s, i) => (stegSpec[stegIndeks(s)]!.system as number[]).push(i));
  svar.resultater.forEach((r) => {
    const [tittel, notat] = delTekst(r.tekst);
    stegSpec[siste]!.resultater!.push({ tittel, notat, til: valg(r, svar.personer.length) });
  });

  const spec: ModulSpec = {
    id,
    navn: svar.navn.trim().slice(0, SHORT),
    maal,
    maalNotat,
    personer: svar.personer.map((p) => delTekst(p.tekst)),
    start: { tittel: startTittel, notat: startNotat },
    steg: stegSpec,
    data: svar.data.map((d) => delTekst(d.tekst, "Felter: ")),
    systemer: svar.systemer.map((s) => {
      const [tittel, notat] = delTekst(s.tekst);
      return { tittel, notat };
    }),
    sporsmal: svar.usikkert.map((u) => u.tekst.trim().slice(0, SHORT)),
  };
  return bygg(spec, plass, { eksempel: false });
}
