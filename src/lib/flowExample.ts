import type { Flow, FlowEdge, FlowNode } from "./flow";

const n = (id: string, type: FlowNode["type"], tittel: string, notat: string, x: number, y: number): FlowNode => ({ id, type, tittel, notat, x, y });
const e = (from: string, to: string): FlowEdge => ({ id: `e-${from}-${to}`, from, to });

/** Eksempelkart som viser hvor lite som trengs. Ikke ekte data. Kolonner på 270 px, rader på 105 px. */
export const exampleFlow = (): Flow => ({
  versjon: 2,
  navn: "Tilbudsforespørsel",
  eksempel: true,
  nodes: [
    n("maal", "maal", "Svar kunder som ber om tilbud innen 24 timer", "I dag svarer vi manuelt på e-post. Det tar to til fem dager, og ingen vet hvem som venter.\nVirker når: kunden får bekreftelse innen ett minutt, og ingen forespørsel er ubesvart etter 24 timer.", 0, 0),
    n("kunde", "person", "Kunde", "Ekstern, uten innlogging. Ser bare sitt eget skjema og bekreftelsen.", -270, -105),
    n("salg", "person", "Salgsansvarlig", "Intern, innlogget. Ser og endrer alle forespørsler.", -270, 20),
    n("start", "start", "Kunden trykker «Be om tilbud» i fastpris-portalen", "Skjema med firmanavn, e-post, valgt konfigurasjon og ønsket oppstart.", 270, 0),
    n("s1", "steg", "Ta imot og lagre forespørselen", "Status «ny».", 540, -60),
    n("s2", "steg", "Send bekreftelse til kunden", "", 540, 50),
    n("s3", "steg", "Varsle salgsansvarlig i Teams", "", 540, 160),
    n("s4", "steg", "Salgsansvarlig følger opp og setter status", "", 540, 270),
    n("r1", "regel", "Ugyldig e-post stopper skjemaet", "Eksempel: «per@» avvises. Ingenting lagres.", 810, -120),
    n("r2", "regel", "Over 200 000 kr varsles også daglig leder", "Eksempel: 250 000 kr gir to varsler.", 810, 160),
    n("r3", "regel", "Påminnelse etter 24 timer med status «ny»", "", 810, 270),
    n("d1", "data", "Forespørsel", "Felter: firmanavn, e-post, konfigurasjon, pris, ønsket oppstart, status, ansvarlig.\nStatuser: ny → under arbeid → tilbud sendt, eller ny → avslått. Kan aldri gå tilbake til ny.", 540, 400),
    n("o1", "resultat", "Bekreftelse på e-post til kunden", "Rett etter innsending.", 810, 40),
    n("o2", "resultat", "Liste over åpne forespørsler", "Side i appen. Eldste først, filtrer på status.", 810, 400),
    n("sys1", "system", "Fastpris-portalen", "Vi henter konfigurasjon og pris derfra. Skal ikke endres.", 270, -150),
    n("sys2", "system", "Microsoft Teams", "Vi sender varsel dit, kanalen «Salg», via webhook.", 1080, 160),
    n("q1", "sporsmal", "Skal konsulenter kunne skrive notater, eller bare lese?", "", -270, 160),
  ],
  edges: [
    e("maal", "kunde"),
    e("maal", "salg"),
    e("maal", "start"),
    e("sys1", "start"),
    e("start", "s1"),
    e("s1", "s2"),
    e("s2", "s3"),
    e("s3", "s4"),
    e("s1", "r1"),
    e("s1", "d1"),
    e("s2", "o1"),
    e("s3", "r2"),
    e("s3", "sys2"),
    e("s4", "r3"),
    e("s4", "o2"),
    e("s4", "salg"),
  ],
});
