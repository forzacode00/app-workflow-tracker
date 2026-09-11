import type { Workflow } from "./types";

/** Eksempelflyt som viser hva et komplett utfylt skjema ser ut som. Ikke ekte data. */
export const exampleWorkflow = (): Workflow => ({
  eksempel: true,
  navn: "Tilbudsforespørsel",
  eier: "Salgsansvarlig",
  problem:
    "Kunder som har brukt fastpris-konfiguratoren sender e-post med spørsmål, og vi svarer manuelt. Det tar to til fem dager, og vi mister oversikt over hvem som venter. Ingen vet om et tilbud er sendt uten å lete i innboksen.",
  suksess:
    "Gitt at kunden sender inn skjemaet, når innsendingen er lagret, så har kunden fått bekreftelse innen ett minutt.\nGitt at det finnes åpne forespørsler, når salgsansvarlig åpner listen, så vises alle med status og alder.\nGitt en forespørsel med status «ny», når det har gått 24 timer, så har salgsansvarlig fått en påminnelse.",
  brukere:
    "Kunde, ekstern, uten innlogging, ser bare sitt eget skjema og bekreftelsen\nSalgsansvarlig, intern, innlogget, ser og endrer alle forespørsler\nKonsulent, intern, innlogget, ser alle forespørsler men endrer ingen",
  triggerType: "Noen fyller ut et skjema",
  trigger:
    "Kunden trykker «Be om tilbud» etter å ha konfigurert en leveranse i fastpris-portalen",
  avgrensning:
    "Ingen e-signering. Ingen automatisk prisforhandling. Ingen integrasjon mot regnskap i første versjon.",
  ukjent: "Skal konsulenter kunne legge inn notater, eller bare lese?\nHvor lenge skal avslåtte forespørsler ligge i listen?",
  inputs: [
    { navn: "Firmanavn", type: "Kort tekst", kilde: "Brukeren skriver inn", pakrevd: true, beskrivelse: "" },
    {
      navn: "Kontakt-e-post",
      type: "E-postadresse",
      kilde: "Brukeren skriver inn",
      pakrevd: true,
      beskrivelse: "Brukes til bekreftelse og oppfølging",
    },
    {
      navn: "Valgt konfigurasjon",
      type: "Lang tekst",
      kilde: "Hentes fra annet system",
      pakrevd: true,
      beskrivelse: "Kommer fra konfiguratoren i fastpris-portalen, med beregnet pris",
    },
    { navn: "Ønsket oppstart", type: "Dato", kilde: "Brukeren skriver inn", pakrevd: false, beskrivelse: "" },
    { navn: "Kommentar", type: "Lang tekst", kilde: "Brukeren skriver inn", pakrevd: false, beskrivelse: "Maks 1000 tegn" },
  ],
  data: [
    {
      entitet: "Forespørsel",
      felter:
        "Firmanavn, e-post, konfigurasjon, pris, ønsket oppstart, kommentar, status, opprettet, ansvarlig",
      eier: "Salgsansvarlig",
      lagring: "I denne appen",
      statuser:
        "ny → under arbeid → tilbud sendt, eller ny → avslått. Bare salgsansvarlig flytter status. Kan aldri gå tilbake til ny.",
    },
    {
      entitet: "Statusendring",
      felter: "Forespørsel, fra-status, til-status, hvem, tidspunkt, notat",
      eier: "Salgsansvarlig",
      lagring: "I denne appen",
      statuser: "",
    },
  ],
  steg: [
    {
      tittel: "Ta imot forespørsel",
      beskrivelse: "Skjemaet valideres og lagres som en forespørsel med status «ny».",
      regel: "Når e-post mangler eller er ugyldig, skal skjemaet vise feil og ikke lagre. Eksempel: «per@» avvises.",
      unntak: "Hvis konfigurasjonen fra portalen mangler, lagres forespørselen likevel, og salgsansvarlig får beskjed om å hente den manuelt.",
    },
    {
      tittel: "Bekreft til kunde",
      beskrivelse: "Kunden får en e-post med oppsummering av konfigurasjon og pris.",
      regel: "",
      unntak: "Hvis e-posten ikke kan sendes, prøves det igjen tre ganger. Deretter varsles salgsansvarlig.",
    },
    {
      tittel: "Varsle salgsansvarlig",
      beskrivelse: "Melding i Teams-kanalen «Salg» med lenke til forespørselen.",
      regel: "Når prisen er over 200 000 kr, skal også daglig leder varsles. Eksempel: 250 000 kr gir to varsler.",
      unntak: "",
    },
    {
      tittel: "Følg opp",
      beskrivelse: "Salgsansvarlig åpner forespørselen, setter status og ansvarlig, skriver notat.",
      regel: "Når status fortsatt er «ny» etter 24 timer, skal salgsansvarlig få en påminnelse.",
      unntak: "Hvis salgsansvarlig er borte, kan konsulent ikke overta. Det må løses manuelt i første versjon.",
    },
    {
      tittel: "Avslutt",
      beskrivelse: "Status settes til «tilbud sendt» eller «avslått», med notat.",
      regel: "Status kan ikke gå tilbake til «ny».",
      unntak: "",
    },
  ],
  outputs: [
    { navn: "Bekreftelse til kunde", format: "E-post", mottaker: "Kunden", kanal: "Sendes automatisk rett etter innsending" },
    { navn: "Varsel om ny forespørsel", format: "Melding i Teams", mottaker: "Salgsansvarlig", kanal: "Kanalen «Salg»" },
    {
      navn: "Liste over åpne forespørsler",
      format: "Side i appen",
      mottaker: "Salgsansvarlig og konsulenter",
      kanal: "Sortert på eldste først, filtrer på status",
    },
  ],
  koblinger: [
    {
      system: "Fastpris-portalen (konfiguratoren)",
      retning: "Vi henter data derfra",
      hva: "Valgt konfigurasjon og beregnet pris",
      hvordan: "Konfiguratoren sender data med i skjemaet når kunden trykker «Be om tilbud»",
    },
    {
      system: "Microsoft Teams",
      retning: "Vi sender data dit",
      hva: "Varsel med lenke",
      hvordan: "Innkommende webhook i kanalen «Salg»",
    },
    {
      system: "Kundeliste (regneark i SharePoint)",
      retning: "Vi sender data dit",
      hva: "Ny rad per forespørsel",
      hvordan: "Etter første versjon. Nevnes så Claude ikke låser datamodellen.",
    },
  ],
});
